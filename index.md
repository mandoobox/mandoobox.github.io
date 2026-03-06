---
layout: default
title: Home
---

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

<ul class="post-list" data-post-list>
  {% for post in site.posts %}
  {% assign post_category = post.category %}
  {% if post_category == nil and post.categories and post.categories.size > 0 %}
    {% assign post_category = post.categories | first %}
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
  </li>
  {% endfor %}
</ul>

<p class="post-list__empty" data-post-empty hidden>{{ site.data.theme.labels.empty_posts }}</p>
