class ConfigsController < ApplicationController
  before_action :require_user_logged_in!

  # TODO use anchor or param to show a specified settings tab
  def index
  end

  def update_csv_config
    if Current.user.csv_config.update(csv_params)
      Current.user.csv_config.destroy_blanks
      add_field # TODO: remove this after UI is reactive.
      redirect_to settings_path, notice: @notice || "CSV settings updated."
    else
      render :index
    end
  end

  # def add_format
  #   update_csv_config("Blank format added.") do
  #     Current.user.csv_config.formats.create
  #   end
  # end

  # def add_type
  #   update_csv_config("Blank type added.") do
  #     Current.user.csv_config.types.create
  #   end
  # end

  # def add_custom_column
  #   update_csv_config("Blank custom column added.") do
  #     Current.user.csv_config.custom_columns.create
  #   end
  # end

  def update_visibility_config
    if Current.user.visibility_configs.find_by(level: params[:level]).update(visibility_params)
      redirect_to settings_path, notice: "Visibility settings updated."
    else
      render :index
    end
  end

  def update_password
    if Current.user.update(password_params)
      redirect_to settings_path, notice: "Password updated."
    else
      render :index
    end
  end

  private

  def add_field
    if params[:csv_config_add_format]
      Current.user.csv_config.formats.create
      @notice = "Blank format added."
    elsif params[:csv_config_add_type]
      Current.user.csv_config.types.create
      @notice = "Blank type added."
    elsif params[:csv_config_add_column]
      Current.user.csv_config.custom_columns.create
      @notice = "Blank column added."
    else
      @notice = nil
    end
  end

  def csv_params
    params.require(:csv_config)
          .permit(:formats_attributes,
                  :types_attributes,
                  :custom_columns_attributes,
                  :rating_enabled,
                  :sources_isbn_enabled,
                  :dates_started_enabled,
                  :genres_enabled,
                  :length_enabled,
                  :public_notes_enabled,
                  :blurb_enabled,
                  :private_notes_enabled,
                  :history_enabled,
                  :maximum_rating,
                  :rating_key,
                  :group_read_emoji,
                  :date_separator,
                  :notes_newline,
                  :extra_info_prefixes_string,
                  :extra_info_postfixes_string)
  end

  def visibility_params
    params.require(:visibility_config)
          .permit(:minimum_rating,
                  :formats_visible,
                  :group_reads_visible,
                  :planned_visible,
                  :public_notes_visible,
                  :private_notes_visible)
  end

  def password_params
    params.require(:user).permit(:password,
                                  :password_confirmation)
  end

end