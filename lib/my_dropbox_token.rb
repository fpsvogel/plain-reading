class MyDropboxToken < DropboxApi::Token
  def save_token(token)
    if Current.user.dropbox_account.nil?
      Current.user.create_dropbox_account
    end
    Current.user.dropbox_account.update(
      token: token
    )
  end
end
