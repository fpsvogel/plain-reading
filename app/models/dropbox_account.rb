class DropboxAccount < ApplicationRecord
  belongs_to :user

  serialize :token, Hash
  attr_reader :client

  after_initialize :reset_client

  def reset_client
    authenticated_token = MyDropboxToken.new(DropboxController.authenticator, token)
    @client = DropboxApi::Client.new(authenticated_token)
  end

  def reading_csv_file
    # TODO show error or prompt if file path has not been set.
    uri = URI(client.get_temporary_link(filepath || "/reading.csv").link)
    Net::HTTP.get(uri)
  end

  def file_exists?
    begin
      client.get_preview(filepath || "/reading.csv")
      return true
    rescue DropboxApi::Errors::NotFoundError
      return false
    end
  end
end
