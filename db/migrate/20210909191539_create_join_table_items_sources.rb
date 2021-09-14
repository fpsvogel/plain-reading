class CreateJoinTableItemsSources < ActiveRecord::Migration[6.1]
  def change
    create_join_table :items, :sources do |t|
      # t.index [:item_id, :source_id]
      # t.index [:source_id, :item_id]
    end
  end
end
