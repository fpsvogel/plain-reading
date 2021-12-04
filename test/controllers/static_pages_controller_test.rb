require "test_helper"

class StaticPagesControllerTest < ActionController::TestCase
  test "should get home" do
    get :home
    assert_response :success
    assert_select "title", full_title
  end

  test "should get guide" do
    get :guide
    assert_response :success
    assert_select "title", full_title("Guide")
  end
end
