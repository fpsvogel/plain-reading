class ListsController < ApplicationController

  def show
    username = request.path.split("/").last
    user = User.find_by(username: username)
    if user.nil?
      not_found(username)
      return
    end
    @is_current_user = user == current_user
    @items, @show_planned_list = user.list.visible_items
    @items = @items.to_a
    @items_planned, @items_so_far = @items.partition(&:planned?)
    @any_items = user.list.items.any?
    @genres = user.list.visible_genres(@items)
    @ratings = user.list.visible_ratings(@items)
    @config = user.csv_config
  end

  def sync(selective: true)
    if current_user.dropbox_account.file_exists?
      current_user.list.load_items(selective: selective)
      redirect_after_loading
    else
      if current_user.dropbox_account.filepath.nil? # if path hasn't yet been set.
        redirect_back(alert: "Could not sync. Please set the path to your reading list in Settings ⇨ Dropbox sync ⇨ File path.", fallback_location: root_path)
      else # path has been set, but it's a nonexistent file.
        redirect_back(alert: "File not found! Fix the path to your reading list in Settings ⇨ Dropbox sync ⇨ File path.", fallback_location: root_path)
      end
    end
  end

  def sync_all
    sync(selective: false)
  end

  def upload
    file = params[:uploaded_file]
    if file.original_filename.match?(/\.csv\z/)
      current_user.list.load_items(uploaded_file: file.tempfile, selective: false)
      redirect_after_loading
    else
      redirect_back(fallback_location: root_path, alert: "Only a CSV file can be uploaded.")
    end
  end

  def errors
    @errors = current_user.list.load_errors
  end

  private

  def not_found(username)
    redirect_to root_path, alert: "User \"#{username}\" not found."
  end

  def redirect_after_loading
    if current_user.list.load_errors&.any?
      redirect_to current_user.list.path, alert: "Not all items could be loaded. #{view_context.link_to "View the errors here.", errors_path}"
    else
      redirect_to current_user.list.path, notice: "List updated successfully."
    end
  end
end