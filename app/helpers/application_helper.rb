module ApplicationHelper
  # returns the full title on a per-page basis.
  def full_title(page_title = "")
    base_title = "Plain Reading"
    if page_title.empty?
      base_title
    else
      "#{page_title} | #{base_title}".html_safe
      # or: raw "#{page_title} | #{base_title}"
      # or: page_title + " | " + base_title
    end
  end
end
