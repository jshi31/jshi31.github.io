$(document).ready(function() {

  // Variables
  var $codeSnippets = $('.code-example-body'),
      $nav = $('.navbar'),
      $body = $('body'),
      $window = $(window),
      $popoverLink = $('[data-popover]'),
      navOffsetTop = $nav.offset().top,
      $document = $(document),
      entityMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': '&quot;',
        "'": '&#39;',
        "/": '&#x2F;'
      }

  function init() {
    $window.on('scroll', onScroll)
    $window.on('resize', resize)
    $popoverLink.on('click', openPopover)
    $document.on('click', closePopover)
    $('a[href^="#"]').on('click', smoothScroll)
    buildSnippets();
    buildPublications();
  }

  function smoothScroll(e) {
    e.preventDefault();
    $(document).off("scroll");
    var target = this.hash,
        menu = target;
    $target = $(target);
    $('html, body').stop().animate({
        'scrollTop': $target.offset().top-40
    }, 0, 'swing', function () {
        window.location.hash = target;
        $(document).on("scroll", onScroll);
    });
  }

  function openPopover(e) {
    e.preventDefault()
    closePopover();
    var popover = $($(this).data('popover'));
    popover.toggleClass('open')
    e.stopImmediatePropagation();
  }

  function closePopover(e) {
    if($('.popover.open').length > 0) {
      $('.popover').removeClass('open')
    }
  }

  $("#button").click(function() {
    $('html, body').animate({
        scrollTop: $("#elementtoScrollToID").offset().top
    }, 2000);
});

  function resize() {
    $body.removeClass('has-docked-nav')
    navOffsetTop = $nav.offset().top
    onScroll()
  }

  function onScroll() {
    if(navOffsetTop < $window.scrollTop() && !$body.hasClass('has-docked-nav')) {
      $body.addClass('has-docked-nav')
    }
    if(navOffsetTop > $window.scrollTop() && $body.hasClass('has-docked-nav')) {
      $body.removeClass('has-docked-nav')
    }
  }

  function escapeHtml(string) {
    return String(string).replace(/[&<>"'\/]/g, function (s) {
      return entityMap[s];
    });
  }

  function buildSnippets() {
    $codeSnippets.each(function() {
      var newContent = escapeHtml($(this).html())
      $(this).html(newContent)
    })
  }

  function authorSearchUrl(name) {
    return 'https://scholar.google.com/citations?view_op=search_authors&mauthors=' + encodeURIComponent(name);
  }

  function appendAuthors($target, authors) {
    authors.forEach(function(rawName, idx) {
      var equalContribution = /\*$/.test(rawName);
      var name = rawName.replace(/\*$/, '');
      if (idx > 0) {
        $target.append(document.createTextNode(', '));
      }

      var $name;
      if (name === 'Jing Shi') {
        $name = $('<b></b>').text(name);
      } else if (name === 'Anonymous authors') {
        $name = $('<span></span>').text(name);
      } else {
        $name = $('<a target="_blank"></a>')
          .attr('href', (window.AUTHOR_LINKS && window.AUTHOR_LINKS[name]) || authorSearchUrl(name))
          .text(name);
      }

      $target.append($name);
      if (equalContribution) {
        $target.append($('<sup></sup>').text('‡'));
      }
    });
  }

  function paperMatchesTopic(paper, topic) {
    if (topic === 'all') return true;
    if (topic === 'selected') return paper.selected;
    return paper.topics && paper.topics.indexOf(topic) !== -1;
  }

  function arxivSortKeyFromLinks(paper) {
    var links = paper.links || [];
    for (var i = 0; i < links.length; i++) {
      var match = /arxiv\.org\/abs\/(\d{2})(\d{2})\.(\d+)/i.exec(links[i].url);
      if (match) {
        return '20' + match[1] + '-' + match[2] + '-' + match[3].padStart(5, '0');
      }
    }
    return '';
  }

  function publicationSortKey(paper) {
    var overrideKeys = window.PUBLICATION_SORT_KEYS || {};
    return arxivSortKeyFromLinks(paper) || overrideKeys[paper.title] || '0000-00-00000';
  }

  function buildPaperRow(paper) {
    var $entry = $('<div class="publication-entry"></div>');
    var $figure = $('<div class="figure publication-figure"></div>');
    $('<img alt="">')
      .attr('src', paper.image)
      .attr('alt', paper.title + ' teaser')
      .appendTo($figure);

    var $paper = $('<div class="paper publication-paper"></div>');
    $('<p class="title"></p>').append($('<b></b>').text(paper.title)).appendTo($paper);

    var $authors = $('<p class="paper-authors"></p>');
    appendAuthors($authors, paper.authors);
    $authors.appendTo($paper);

    $('<p></p>').append($('<em></em>').text(paper.venue)).appendTo($paper);

    if (paper.links && paper.links.length) {
      var $buttons = $('<div class="paper-buttons"></div>');
      paper.links.forEach(function(link) {
        $('<a class="button" target="_blank"></a>')
          .attr('href', link.url)
          .text(link.label)
          .appendTo($buttons);
      });
      $buttons.appendTo($paper);
    }

    $entry.append($figure).append($paper);
    return $entry;
  }

  function renderPublications(topic) {
    var papers = window.PUBLICATIONS || [];
    var filtered = papers
      .filter(function(paper) { return paperMatchesTopic(paper, topic); })
      .sort(function(a, b) {
        var dateOrder = publicationSortKey(b).localeCompare(publicationSortKey(a));
        if (dateOrder !== 0) return dateOrder;
        return papers.indexOf(a) - papers.indexOf(b);
      });
    var $list = $('#publication-list');
    $list.empty();
    filtered.forEach(function(paper) {
      $list.append(buildPaperRow(paper));
    });
    $('#publication-count').text(filtered.length + ' papers');
  }

  function buildPublications() {
    if (!window.PUBLICATIONS || !window.PUBLICATION_TOPICS || !$('#publication-list').length) {
      return;
    }

    var $tabs = $('#publication-tabs');
    $tabs.empty();
    window.PUBLICATION_TOPICS.forEach(function(topic, idx) {
      var $button = $('<button type="button" class="button publication-tab"></button>')
        .attr('data-topic', topic.key)
        .text(topic.label);
      if (idx === 0) {
        $button.addClass('active');
      }
      $tabs.append($button);
    });

    $tabs.on('click', '.publication-tab', function() {
      var topic = $(this).data('topic');
      $('.publication-tab').removeClass('active');
      $(this).addClass('active');
      renderPublications(topic);
    });

    renderPublications('all');
  }


  init();

});
