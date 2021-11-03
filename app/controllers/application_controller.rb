class ApplicationController < ActionController::Base

  private

  # called by the require_login before action, if a user is not logged in.
  def not_authenticated
    redirect_to login_path, alert: "You must be logged in to do that."
  end
end
