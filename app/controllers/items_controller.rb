class ItemsController < ApplicationController
  def index

  end

  def sync
    return unless verify_file_exists
    Current.user.sync_items
  end

  def sync_all
    return unless verify_file_exists
    Current.user.sync_items
  end

  def upload
    file = params[:uploaded_file]
    if file.original_filename.match?(/\.csv\z/)
      Current.user.sync_items(uploaded_file: file.tempfile)
    else
      redirect_to root_path, alert: "Only a CSV file can be uploaded."
    end
  end

  private

  def verify_file_exists
    begin
      Current.user.dropbox_account.client.get_preview("/reading.csv")
      Current.user.dropbox_account.filepath = "/reading.csv"
      Current.user.dropbox_account.save
    rescue DropboxApi::Errors::NotFoundError
      if Current.user.dropbox_account.filepath.nil? # if path hasn't yet been set.
        redirect_back(alert: "Could not sync. Please set the path to your reading list in Settings ⇨ Dropbox sync ⇨ File path.", fallback_location: root_path)
      else # path has been set, but it's a nonexistent file.
        redirect_back(alert: "File not found! Fix the path to your reading list in Settings ⇨ Dropbox sync ⇨ File path.", fallback_location: root_path)
      end
      return false
    end
    true
  end
end