Rails.application.routes.draw do
  root to: "main#index"

  get "register", to: "registrations#new"
  post "register", to: "registrations#create"

  get "login", to: "sessions#new"
  post "login", to: "sessions#create"
  delete "logout", to: "sessions#destroy"

  get "list", to: "items#index"

  get "friends", to: "friends#index"

  get "settings", to: "configs#index"

  patch "csv-config/update", to: "configs#update_csv_config"
  # post "csv-config/add-format", to: "configs#add_format"
  # post "csv-config/add-type", to: "configs#add_type"
  # post "csv-config/add-custom-column", to: "configs#add_custom_column"
  patch "visibility-config/update", to: "configs#update_visibility_config"

  patch "password/update", to: "configs#update_password"

  post "sync", to: "items#sync"
  post "sync-all", to: "items#sync_all"
  post "upload", to: "items#upload"

  get "dropbox/auth" => "dropbox#auth"
  get "dropbox/auth/callback", to: "dropbox#auth_callback"
  delete "dropbox/disconnect", to: "dropbox#disconnect"
  patch "dropbox/update-filepath", to: "dropbox#update_filepath"

  get "password/reset", to: "password_resets#new"
  post "password/reset", to: "password_resets#create"
  get "password/reset/edit", to: "password_resets#edit"
  patch "password/reset/edit", to: "password_resets#update"
end
