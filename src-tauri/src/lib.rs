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

#[derive(serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct Settings {
  claude_dir: String,   // serializes as "claudeDir"
  auto_index: bool      // serializes as "autoIndex"
}



#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
  std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn read_claude_dir(claude_dir: String) -> Result<Vec<ProjectEntry>, String> {
  let projects_path = format!("{}\\projects", claude_dir);

  // mutable arr of projects
  let mut projects: Vec<ProjectEntry> = Vec::new();

  for entry in std::fs::read_dir(projects_path).map_err(|e| e.to_string())? {
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
    let reconstructed = raw.replace('-', "\\");
    let display_name = reconstructed.split("\\").last().unwrap_or(&raw).to_string();

    projects.push(ProjectEntry {
      name: display_name,
      path: path.to_string_lossy().to_string(),
      files: files
    });
  }

  Ok(projects)
}

#[tauri::command]
fn get_api_key() -> Result<String, String> {
  let keyring_entry = keyring::Entry::new("ccct", "anthropic_api_key").map_err(|e| e.to_string())?;
  let api_key = keyring_entry.get_password().map_err(|e| e.to_string())?;

  return Ok(api_key)
}

#[tauri::command]
fn set_api_key(key: String) -> Result<(), String> {
  let keyring_entry = keyring::Entry::new("ccct", "anthropic_api_key").map_err(|e| e.to_string())?;
  keyring_entry.set_password(&key).map_err(|e| e.to_string())?;

  return Ok(())
}

#[tauri::command]
fn delete_api_key() -> Result<(), String> {
  let keyring_entry = keyring::Entry::new("ccct", "anthropic_api_key").map_err(|e| e.to_string())?;
  keyring_entry.delete_password().map_err(|e| e.to_string())?;

  return Ok(())
}

#[tauri::command]
fn get_settings() -> Result<Settings, String> {
  // build the path for settings file
  let app_data = std::env::var("APPDATA").map_err(|e|e.to_string())?;
  let settings_path = format!("{}\\ccct\\settings.json", app_data);

  // building directory
  let settings_dir =format!("{}\\ccct", app_data);
  std::fs::create_dir_all(&settings_dir).map_err(|e| e.to_string())?;

  // read file
  match std::fs::read_to_string(&settings_path) {
    Ok(content) => {
      let settings = serde_json::from_str::<Settings>(&content).map_err(|e| e.to_string())?;

      Ok(settings)
    }

    Err(_) => {
      // doesnt exist
      let home = std::env::var("USERPROFILE").map_err(|e| e.to_string())?;

      Ok(Settings {
        claude_dir: format!("{}\\.claude", home),
        auto_index: true
      })
    }
  }
}

#[tauri::command]
fn save_settings(settings: Settings) -> Result<(), String> {
  // build the path for settings file
  let app_data = std::env::var("APPDATA").map_err(|e|e.to_string())?;
  let settings_path = format!("{}\\ccct\\settings.json", app_data);

  // building directory
  let settings_dir =format!("{}\\ccct", app_data);
  std::fs::create_dir_all(&settings_dir).map_err(|e| e.to_string())?;

  // convert settings struct into json string & save it
  let json_string = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
  std::fs::write(&settings_path, json_string).map_err(|e| e.to_string())?;

  Ok(())
}

#[tauri::command]
fn read_index() -> Result<String, String> {
  // build the path for index file
  let app_data = std::env::var("APPDATA").map_err(|e|e.to_string())?;
  let index_path = format!("{}\\ccct\\index.json", app_data);

  // read file
  match std::fs::read_to_string(&index_path) {
    Ok(content) => Ok(content),

    Err(_) => {
      // doesnt exist
      Err("Index file not found".to_string())
    }
  }
}

#[tauri::command]
fn write_index(content: String) -> Result<(), String> {
  // build the path for index file
  let app_data = std::env::var("APPDATA").map_err(|e|e.to_string())?;
  let index_path = format!("{}\\ccct\\index.json", app_data);

  // building directory
  let settings_dir =format!("{}\\ccct", app_data);
  std::fs::create_dir_all(&settings_dir).map_err(|e| e.to_string())?;

  std::fs::write(&index_path, content).map_err(|e| e.to_string())?;

  Ok(())
}



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
    .plugin(tauri_plugin_dialog::init())
    // mapping rust functions for tauri
    .invoke_handler(tauri::generate_handler![
      read_file,
      read_claude_dir,
      get_api_key,
      set_api_key,
      delete_api_key,
      get_settings,
      save_settings,
      read_index,
      write_index
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
