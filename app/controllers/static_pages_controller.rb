class StaticPagesController < ApplicationController
  def home
    if logged_in?
      redirect_to current_user.list.path
    end
  end

  def guide
  end
end
