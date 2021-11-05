class SessionsController < ApplicationController
  def new
  end

  def create
    user = login(params[:email], params[:password], params[:remember_me])
    if user
      redirect_back_or_to root_path, notice: "Logged in successfully."
    else
      flash.now[:alert] = "Invalid email or password."
      render :new, status: :see_other
    end
  end

  def destroy
    logout
    redirect_to root_path, notice: "Logged out.", status: 303
  end
end
