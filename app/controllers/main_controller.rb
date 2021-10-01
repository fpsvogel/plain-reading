class MainController < ApplicationController
  def index
    if Current.user
      redirect_to Current.user.list.path
    end
  end
end
