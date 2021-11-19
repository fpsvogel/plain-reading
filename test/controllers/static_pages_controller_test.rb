require "test_helper"

class StaticPagesControllerTest < ActionDispatch::IntegrationTest
  test "should get home" do
    get root_path
    assert_response :success
    assert_select "title", full_title
  end

  test "should get guide" do
    get guide_path
    assert_response :success
    assert_select "title", full_title("Guide")
  end
end
