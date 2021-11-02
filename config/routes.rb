Rails.application.routes.draw do
  root to: "main#index"

  resource :registration, only: [] do
    get  :new   , path: 'register'
    post :create, path: 'register'
  end

  resource :session, only: [] do
    get  :new    , path: 'login'
    post :create , path: 'login'
    get  :destroy, path: 'logout' # TODO why doesn't the delete method work here? it's caught by "*path" below.
  end

  resource :password_reset, only: [] do
    get   :new   , path: 'password/reset'
    post  :create, path: 'password/reset'
    get   :edit  , path: 'password/reset/edit'
    patch :update, path: 'password/reset/edit'
  end

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

  get "*path", to: "lists#show"
end
