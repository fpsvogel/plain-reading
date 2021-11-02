class ApplicationController < ActionController::Base

  private

  def not_authenticated
    redirect_to login_path, alert: "You must be logged in to do that."
  end
end
