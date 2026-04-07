#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    // mapping rust functions for tauri
    .invoke_handler(tauri::generate_handler![read_file, read_claude_dir])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}


#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
  std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[derive(serde::Serialize)]
struct ConversationEntry {
  path: String,
  filename: String
}

#[derive(serde::Serialize)]
struct ProjectEntry {
  name: String,
  path: String,
  files: Vec<ConversationEntry>
}

#[tauri::command]
fn read_claude_dir() -> Result<Vec<ProjectEntry>, String> {
  // mutable arr of projects
  let mut projects: Vec<ProjectEntry> = Vec::new();

  for entry in std::fs::read_dir("TEMPORARY HARDCODED STRING PLACEHOLDER").map_err(|e| e.to_string())? {
    // entry is now one item in the directory
    let entry = entry.map_err(|e| e.to_string())?;
    // mutable arr of files
    let mut files = Vec::new();
    
    // entry.path() gives you the full path
    // entry.folder_name() gives you just the folder name
    let path = entry.path();
    let folder_name = entry.file_name();

    for file in std::fs::read_dir(&path).map_err(|e| e.to_string())? {
      // we are accessing each file present within the project folder
      let file = file.map_err(|e| e.to_string())?;
      // grabbing the full file path
      let file_path = file.path();

      // if file is jsonl type push into files arr
      if file_path.extension().and_then(|e| e.to_str()) == Some("jsonl") {
        files.push(ConversationEntry {
          path: file_path.to_string_lossy().to_string(),
          filename: file.file_name().to_string_lossy().to_string()
        });
      }
    }

    let raw = folder_name.to_string_lossy().to_string();
    let display_name = raw.split('-').last().unwrap_or(&raw).to_string();

    projects.push(ProjectEntry {
      name: display_name,
      path: path.to_string_lossy().to_string(),
      files: files
    });
  }

  Ok(projects)
}