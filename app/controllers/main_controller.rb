class MainController < ApplicationController
  def index
    if logged_in?
      redirect_to current_user.list.path
    end
  end
end
