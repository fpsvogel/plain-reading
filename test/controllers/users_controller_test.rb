require "test_helper"

class UsersControllerTest < ActionController::TestCase
  def setup
    @user = users(:sam)
  end

  test "should get new" do
    get :new
    assert_response :success
  end

  test "should post create" do
    post :create, params: { user: { username: "test",
                                    email: "test@example.com",
                                    password: "password",
                                    password_confirmation: "password" } }
    assert_redirected_to root_path
    assert_equal("Successfully created account.", flash[:notice])
  end
end
