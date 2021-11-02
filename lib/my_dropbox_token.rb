class MyDropboxToken < DropboxApi::Token
  def save_token(token)
    if current_user.dropbox_account.nil?
      current_user.create_dropbox_account
    end
    current_user.dropbox_account.update(
      token: token
    )
  end
end
