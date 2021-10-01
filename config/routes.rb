Rails.application.routes.draw do
  root to: "main#index"

  get "register", to: "registrations#new"
  post "register", to: "registrations#create"

  get "login", to: "sessions#new"
  post "login", to: "sessions#create"
  get "logout", to: "sessions#destroy" # TODO why doesn't the delete method work here? it's caught by "*path" below.

  get "friends", to: "friends#index"

  get "settings", to: "configs#index"

  patch "config/update-csv", to: "configs#update_csv_config"
  patch "config/update-visibility", to: "configs#update_visibility_config"
  patch "config/update-account", to: "configs#update_account_config"

  post "sync", to: "lists#sync"
  post "sync-all", to: "lists#sync_all"
  post "upload", to: "lists#upload"
  get "errors", to: "lists#errors"

  get "dropbox/auth" => "dropbox#auth"
  get "dropbox/auth/callback", to: "dropbox#auth_callback"
  delete "dropbox/disconnect", to: "dropbox#disconnect"
  patch "dropbox/update-filepath", to: "dropbox#update_filepath"

  get "password/reset", to: "password_resets#new"
  post "password/reset", to: "password_resets#create"
  get "password/reset/edit", to: "password_resets#edit"
  patch "password/reset/edit", to: "password_resets#update"

  get "*path", to: "lists#show"
end
