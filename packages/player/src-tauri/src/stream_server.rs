use std::io::SeekFrom;
use std::path::PathBuf;

use axum::body::Body;
use axum::extract::Path;
use axum::http::{header, HeaderMap, Response, StatusCode};
use axum::routing::get;
use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
use tauri::{AppHandle, Manager};
use tokio::io::{AsyncReadExt, AsyncSeekExt};
use tokio::sync::oneshot;
use tokio_util::io::ReaderStream;
use tokio_util::sync::CancellationToken;

use crate::local_library::is_audio_path;

const PORT_START: u16 = 9100;
const PORT_END: u16 = 9109;

pub struct StreamServerState {
    port: u16,
}

fn decode_local_path(encoded: &str) -> Result<PathBuf, String> {
    let bytes = URL_SAFE_NO_PAD
        .decode(encoded)
        .map_err(|err| format!("Invalid base64 path: {err}"))?;

    let path = PathBuf::from(
        String::from_utf8(bytes).map_err(|err| format!("Invalid UTF-8 in path: {err}"))?,
    );

    if !is_audio_path(&path) {
        return Err("Only audio files can be served".to_string());
    }

    Ok(path)
}

fn parse_byte_range(value: &str, total_length: u64) -> Option<(u64, u64)> {
    if total_length == 0 {
        return None;
    }

    let spec = value.strip_prefix("bytes=")?.split(',').next()?.trim();
    let (start, end) = spec.split_once('-')?;
    let last_byte = total_length - 1;

    if start.is_empty() {
        let suffix_length: u64 = end.parse().ok()?;
        return Some((total_length.saturating_sub(suffix_length), last_byte));
    }

    let start: u64 = start.parse().ok()?;
    let end = if end.is_empty() {
        last_byte
    } else {
        end.parse::<u64>().ok()?.min(last_byte)
    };

    if start > end {
        return None;
    }

    Some((start, end))
}

fn cors_headers(headers: &mut HeaderMap) {
    headers.insert(header::ACCESS_CONTROL_ALLOW_ORIGIN, "*".parse().unwrap());
    headers.insert(
        header::ACCESS_CONTROL_ALLOW_METHODS,
        "GET, OPTIONS, HEAD".parse().unwrap(),
    );
    headers.insert(
        header::ACCESS_CONTROL_ALLOW_HEADERS,
        "Range".parse().unwrap(),
    );
    headers.insert(
        header::ACCESS_CONTROL_EXPOSE_HEADERS,
        "Content-Range, Content-Length, Accept-Ranges"
            .parse()
            .unwrap(),
    );
}

fn error_response(status: StatusCode, message: String) -> Response<Body> {
    let mut response = Response::builder()
        .status(status)
        .body(Body::from(message))
        .unwrap();
    cors_headers(response.headers_mut());
    response
}

async fn serve_local_file(Path(encoded_path): Path<String>, headers: HeaderMap) -> Response<Body> {
    let path = match decode_local_path(&encoded_path) {
        Ok(path) => path,
        Err(message) => {
            log::error!("[StreamServer] {message}");
            return error_response(StatusCode::BAD_REQUEST, message);
        }
    };

    let mut file = match tokio::fs::File::open(&path).await {
        Ok(file) => file,
        Err(err) => {
            log::error!("[StreamServer] Could not open {}: {err}", path.display());
            return error_response(StatusCode::NOT_FOUND, format!("File not found: {err}"));
        }
    };

    let total_length = match file.metadata().await {
        Ok(metadata) => metadata.len(),
        Err(err) => {
            return error_response(StatusCode::INTERNAL_SERVER_ERROR, err.to_string());
        }
    };

    let mime_type = mime_guess::from_path(&path)
        .first_or_octet_stream()
        .to_string();

    let requested_range = headers
        .get(header::RANGE)
        .and_then(|value| value.to_str().ok())
        .and_then(|value| parse_byte_range(value, total_length));

    let mut builder = Response::builder()
        .header(header::CONTENT_TYPE, mime_type)
        .header(header::ACCEPT_RANGES, "bytes");

    let body = match requested_range {
        Some((start, end)) => {
            if let Err(err) = file.seek(SeekFrom::Start(start)).await {
                return error_response(StatusCode::INTERNAL_SERVER_ERROR, err.to_string());
            }
            let length = end - start + 1;
            builder = builder
                .status(StatusCode::PARTIAL_CONTENT)
                .header(header::CONTENT_LENGTH, length)
                .header(
                    header::CONTENT_RANGE,
                    format!("bytes {start}-{end}/{total_length}"),
                );
            Body::from_stream(ReaderStream::new(file.take(length)))
        }
        None => {
            builder = builder
                .status(StatusCode::OK)
                .header(header::CONTENT_LENGTH, total_length);
            Body::from_stream(ReaderStream::new(file))
        }
    };

    let mut response = builder.body(body).unwrap();
    cors_headers(response.headers_mut());
    response
}

async fn options_handler() -> Response<Body> {
    let mut response = Response::builder()
        .status(StatusCode::NO_CONTENT)
        .body(Body::empty())
        .unwrap();
    cors_headers(response.headers_mut());
    response
}

async fn start_server(ready: oneshot::Sender<Result<u16, String>>) {
    let cancellation_token = CancellationToken::new();

    let router = axum::Router::new()
        .route(
            "/file/{encoded_path}",
            get(serve_local_file).options(options_handler),
        );

    let tcp_listener =
        match crate::net::bind_first_available_port("127.0.0.1", PORT_START, PORT_END).await {
            Ok(listener) => listener,
            Err(message) => {
                log::error!("Failed to bind stream server: {message}");
                let _ = ready.send(Err(message));
                return;
            }
        };

    let bound_port = tcp_listener.local_addr().unwrap().port();
    log::info!("Stream server listening on http://127.0.0.1:{bound_port}");
    let _ = ready.send(Ok(bound_port));

    let _ = axum::serve(tcp_listener, router)
        .with_graceful_shutdown(async move {
            cancellation_token.cancelled().await;
        })
        .await;

    log::info!("Stream server stopped");
}

pub fn init_stream_server(app_handle: AppHandle) {
    let (ready_tx, ready_rx) = oneshot::channel();
    tauri::async_runtime::spawn(start_server(ready_tx));

    let handle = app_handle.clone();
    tauri::async_runtime::spawn(async move {
        match ready_rx.await {
            Ok(Ok(port)) => {
                log::info!("Stream server ready on port {port}");
                handle.manage(StreamServerState { port });
            }
            Ok(Err(message)) => {
                log::error!("Stream server failed to start: {message}");
            }
            Err(_) => {
                log::error!("Stream server task exited before reporting ready");
            }
        }
    });
}

#[tauri::command]
#[specta::specta]
pub fn stream_server_port(state: tauri::State<'_, StreamServerState>) -> u16 {
    state.port
}

#[cfg(test)]
mod tests {
    use super::*;

    const FILE_LENGTH: u64 = 1000;

    #[test]
    fn parses_bounded_range() {
        assert_eq!(parse_byte_range("bytes=100-199", FILE_LENGTH), Some((100, 199)));
    }

    #[test]
    fn parses_open_ended_range() {
        assert_eq!(parse_byte_range("bytes=500-", FILE_LENGTH), Some((500, 999)));
    }

    #[test]
    fn parses_suffix_range() {
        assert_eq!(parse_byte_range("bytes=-100", FILE_LENGTH), Some((900, 999)));
    }

    #[test]
    fn clamps_range_end_to_file_length() {
        assert_eq!(parse_byte_range("bytes=900-5000", FILE_LENGTH), Some((900, 999)));
    }

    #[test]
    fn rejects_range_starting_past_the_end() {
        assert_eq!(parse_byte_range("bytes=2000-", FILE_LENGTH), None);
    }

    #[test]
    fn only_serves_audio_paths() {
        let encode = |path: &str| URL_SAFE_NO_PAD.encode(path);

        assert!(decode_local_path(&encode("C:/Music/song.mp3")).is_ok());
        assert!(decode_local_path(&encode("C:/Users/secret.txt")).is_err());
    }
}
