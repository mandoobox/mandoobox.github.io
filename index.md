---
layout: default
title: Home
---

<section class="post-search" aria-label="{{ site.data.theme.labels.search }}">
  <div class="post-search__label">
    <span class="material-symbols-outlined" aria-hidden="true">search</span>
    <span>{{ site.data.theme.labels.search }}</span>
  </div>

  <label class="post-search__field" for="post-search-input">
    <span class="sr-only">{{ site.data.theme.labels.search }}</span>
    <input
      class="post-search__input"
      id="post-search-input"
      type="search"
      placeholder="{{ site.data.theme.labels.search_placeholder }}"
      autocomplete="off"
      spellcheck="false"
      aria-controls="post-list"
      data-search-input
    >
    <button class="post-search__clear" type="button" data-search-clear hidden>
      <span class="material-symbols-outlined" aria-hidden="true">close</span>
      <span class="sr-only">{{ site.data.theme.labels.clear_search }}</span>
    </button>
  </label>
</section>

<section class="category-filter" aria-label="{{ site.data.theme.labels.category }}">
  <div class="category-filter__label">
    <span class="material-symbols-outlined" aria-hidden="true">tune</span>
    <span>{{ site.data.theme.labels.category }}</span>
  </div>

  <div class="category-filter__controls" data-category-filter>
    <button class="category-filter__button is-active" type="button" data-category-button="all">{{ site.data.theme.labels.all }}</button>
    {% assign sorted_categories = site.categories | sort %}
    {% for category in sorted_categories %}
    <button class="category-filter__button" type="button" data-category-button="{{ category[0] | slugify }}">{{ category[0] }}</button>
    {% endfor %}
  </div>
</section>

<ul class="post-list" id="post-list" data-post-list>
  {% for post in site.posts %}
  {% assign post_category = post.category %}
  {% if post_category == nil and post.categories and post.categories.size > 0 %}
    {% assign post_category = post.categories | first %}
  {% endif %}
  {% assign post_tags_text = '' %}
  {% if post.tags and post.tags.size > 0 %}
    {% assign post_tags_text = post.tags | join: ' ' %}
  {% endif %}
  <li data-post-item data-category="{{ post_category | slugify }}">
    <a class="post-list__link" href="{{ post.url | relative_url }}">{{ post.title }}</a>
    <div class="post-list__meta meta">
      <span class="meta-item">
        <span class="material-symbols-outlined meta-icon" aria-hidden="true">schedule</span>
        <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%Y-%m-%d" }}</time>
      </span>
      {% if post_category %}
      <span class="meta-item">
        <span class="material-symbols-outlined meta-icon" aria-hidden="true">sell</span>
        <span class="meta-tag">{{ post_category }}</span>
      </span>
      {% endif %}
    </div>
    <span hidden data-post-search-source>{{ post_category }} {{ post_tags_text }} {{ post.excerpt | strip_html | strip_newlines | escape }} {{ post.content | strip_html | strip_newlines | escape }}</span>
  </li>
  {% endfor %}
</ul>

<p class="post-list__empty" data-post-empty hidden>{{ site.data.theme.labels.empty_posts }}</p>
