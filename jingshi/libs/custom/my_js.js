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
    var $entry = $('<div class="publication-entry"></div>').attr('id', slugForPaper(paper));
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

    var $venue = $('<p></p>').append($('<em></em>').text(paper.venue));
    (paper.tags || []).forEach(function(tag) {
      $venue.append(document.createTextNode(' '));
      $('<span class="publication-title-tag"></span>')
        .text('(' + tag + ')')
        .appendTo($venue);
    });
    $venue.appendTo($paper);

    if (paper.links && paper.links.length) {
      var $buttons = $('<div class="paper-buttons"></div>');
      (paper.links || []).forEach(function(link) {
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
  }

  function slugForPaper(paper) {
    return 'pub-' + String(paper.title).toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64);
  }

  function flashEntry(el) {
    var $e = $(el).addClass('publication-entry-flash');
    setTimeout(function() { $e.removeClass('publication-entry-flash'); }, 1400);
  }

  function contentTopics() {
    return (window.PUBLICATION_TOPICS || []).filter(function(t) { return !!t.color; });
  }

  function topicByKey(key) {
    var list = window.PUBLICATION_TOPICS || [];
    for (var i = 0; i < list.length; i++) { if (list[i].key === key) return list[i]; }
    return null;
  }

  var MAP_SHORT = {
    agents: 'Agents & RL',
    eval: 'Evaluation',
    generation: 'Generation',
    understanding: 'Understanding',
    architecture: 'Architecture'
  };

  // ---- hover tooltip card (shows the paper's verbatim abstract) ----
  var $landscapeTip = null, landscapeTipTimer = null;
  function ensureTip() {
    if (!$landscapeTip) {
      $landscapeTip = $('<div class="landscape-tip" role="tooltip"></div>').appendTo('body');
      $landscapeTip.on('mouseenter', function() { clearTimeout(landscapeTipTimer); })
                   .on('mouseleave', hideTip);
    }
    return $landscapeTip;
  }
  function showTip(paper, px, py) {
    var tip = ensureTip();
    clearTimeout(landscapeTipTimer);
    var abstract = (paper.description && paper.description.length) ? paper.description : paper.venue;
    tip.empty();
    $('<div class="landscape-tip-title"></div>').text(paper.title).appendTo(tip);
    $('<div class="landscape-tip-venue"></div>').text(paper.venue).appendTo(tip);
    $('<div class="landscape-tip-abs"></div>').text(abstract).appendTo(tip);
    tip.css({ display: 'block', visibility: 'hidden', left: '0px', top: '0px' });
    var tw = tip.outerWidth(), th = tip.outerHeight(), gap = 16, pad = 10;
    var left = px + gap, top = py - th / 2;
    if (left + tw > window.scrollX + window.innerWidth - pad) left = px - tw - gap;
    if (left < window.scrollX + pad) left = window.scrollX + pad;
    if (top < window.scrollY + pad) top = window.scrollY + pad;
    if (top + th > window.scrollY + window.innerHeight - pad) top = window.scrollY + window.innerHeight - th - pad;
    tip.css({ left: left + 'px', top: top + 'px', visibility: 'visible' });
  }
  function hideTip() {
    landscapeTipTimer = setTimeout(function() {
      if ($landscapeTip) $landscapeTip.css('display', 'none');
    }, 160);
  }

  var landscapeState = { topic: 'selected', svg: null };

  function buildLandscapeMap() {
    var host = document.getElementById('publication-map');
    if (!host || typeof d3 === 'undefined') return false;
    host.innerHTML = '';

    var papers = window.PUBLICATIONS || [];
    var order = ['agents', 'eval', 'understanding', 'generation', 'architecture'];
    var topics = order.map(topicByKey).filter(Boolean);
    contentTopics().forEach(function(t) { if (order.indexOf(t.key) < 0) topics.push(t); });
    if (!topics.length) return false;

    var W = 760, H = 470, cx = W / 2, cy = H / 2 - 6, R = 150, pad = 24;
    var anchors = {};
    topics.forEach(function(t, i) {
      var a = (i / topics.length) * 2 * Math.PI - Math.PI / 2;
      anchors[t.key] = { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
    });

    // Each paper is pulled toward the centroid of its topics' anchors, so
    // multi-topic papers settle inside the overlap of those topic regions.
    var nodes = papers.map(function(p, i) {
      var ts = (p.topics || []).filter(function(k) { return anchors[k]; });
      var tx = cx, ty = cy;
      if (ts.length) {
        tx = d3.mean(ts, function(k) { return anchors[k].x; });
        ty = d3.mean(ts, function(k) { return anchors[k].y; });
      }
      var jitter = (((i * 2654435761) % 1000) / 1000 - 0.5) * 26;
      return { paper: p, ts: ts, tx: tx, ty: ty, x: tx + jitter, y: ty + Math.cos(i) * 12 };
    });

    var sim = d3.forceSimulation(nodes)
      .force('x', d3.forceX(function(d) { return d.tx; }).strength(0.28))
      .force('y', d3.forceY(function(d) { return d.ty; }).strength(0.28))
      .force('collide', d3.forceCollide(8).strength(0.9))
      .force('charge', d3.forceManyBody().strength(-7))
      .stop();
    for (var s = 0; s < 320; s++) sim.tick();
    nodes.forEach(function(d) {
      d.x = Math.max(pad, Math.min(W - pad, d.x));
      d.y = Math.max(pad, Math.min(H - pad, d.y));
    });

    var svg = d3.select(host).append('svg')
      .attr('class', 'landscape-svg')
      .attr('viewBox', '0 0 ' + W + ' ' + H)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr('role', 'img')
      .attr('aria-label', 'Map of research topics; each dot is a paper');
    svg.append('defs').append('filter').attr('id', 'lm-blur')
      .append('feGaussianBlur').attr('in', 'SourceGraphic').attr('stdDeviation', 7);

    var gRegions = svg.append('g').attr('class', 'lm-regions');
    var gLabels = svg.append('g').attr('class', 'lm-labels');
    var gDots = svg.append('g').attr('class', 'lm-dots');
    var gDotLabels = svg.append('g').attr('class', 'lm-dot-labels');
    var lineGen = d3.line().curve(d3.curveCatmullRomClosed.alpha(0.6));

    function paddedRing(pts, p) {
      if (pts.length >= 3) {
        var hull = d3.polygonHull(pts);
        var c = d3.polygonCentroid(hull);
        return hull.map(function(pt) {
          var dx = pt[0] - c[0], dy = pt[1] - c[1], d = Math.sqrt(dx * dx + dy * dy) || 1;
          return [pt[0] + dx / d * p, pt[1] + dy / d * p];
        });
      }
      var cc = pts.length
        ? [d3.mean(pts, function(q) { return q[0]; }), d3.mean(pts, function(q) { return q[1]; })]
        : [cx, cy];
      var rr = pts.length === 2
        ? Math.sqrt(Math.pow(pts[0][0] - pts[1][0], 2) + Math.pow(pts[0][1] - pts[1][1], 2)) / 2 + p + 16
        : p + 26;
      return d3.range(18).map(function(k) {
        var a = k / 18 * 2 * Math.PI;
        return [cc[0] + rr * Math.cos(a), cc[1] + rr * Math.sin(a)];
      });
    }

    topics.forEach(function(t) {
      var pts = nodes.filter(function(nd) { return nd.ts.indexOf(t.key) >= 0; })
                     .map(function(nd) { return [nd.x, nd.y]; });
      if (!pts.length) return;
      gRegions.append('path')
        .attr('class', 'lm-region')
        .attr('data-topic', t.key)
        .attr('d', lineGen(paddedRing(pts, 30)))
        .attr('fill', t.color)
        .attr('filter', 'url(#lm-blur)')
        .style('cursor', 'pointer')
        .on('click', function() { setActiveTopic(t.key); });
    });

    topics.forEach(function(t) {
      var an = anchors[t.key];
      var lx = cx + (an.x - cx) * 1.34, ly = cy + (an.y - cy) * 1.34;
      gLabels.append('text')
        .attr('class', 'lm-label')
        .attr('x', lx).attr('y', ly + 4)
        .attr('text-anchor', Math.abs(lx - cx) < 26 ? 'middle' : (lx < cx ? 'end' : 'start'))
        .attr('fill', t.color)
        .style('cursor', 'pointer')
        .text(MAP_SHORT[t.key] || t.label)
        .on('click', function() { setActiveTopic(t.key); });
    });

    gDots.selectAll('circle').data(nodes).enter().append('circle')
      .attr('class', function(d) { return 'lm-dot' + (d.paper.selected ? ' lm-dot-selected' : ''); })
      .attr('cx', function(d) { return d.x; })
      .attr('cy', function(d) { return d.y; })
      .attr('r', function(d) { return d.paper.selected ? 5.5 : 4; })
      .on('mouseenter', function(event, d) {
        d3.select(this).classed('lm-dot-hover', true).attr('r', d.paper.selected ? 7 : 6);
        var r = this.getBoundingClientRect();
        showTip(d.paper, r.left + r.width / 2 + window.scrollX, r.top + r.height / 2 + window.scrollY);
      })
      .on('mouseleave', function(event, d) {
        d3.select(this).classed('lm-dot-hover', false).attr('r', d.paper.selected ? 5.5 : 4);
        hideTip();
      })
      .on('click', function(event, d) {
        var el = document.getElementById(slugForPaper(d.paper));
        if (el) {
          $('html, body').stop().animate({ scrollTop: $(el).offset().top - 40 }, 350);
          flashEntry(el);
        }
      });

    gDotLabels.selectAll('text').data(nodes.filter(function(d) { return !!d.paper.mapLabel; })).enter().append('text')
      .attr('class', 'lm-dot-label')
      .attr('x', function(d) { return d.x + 8; })
      .attr('y', function(d) { return d.y - 8; })
      .text(function(d) { return d.paper.mapLabel; });

    landscapeState.svg = svg;
    return true;
  }

  function buildLegend() {
    var $tabs = $('#publication-tabs');
    if (!$tabs.length) return;
    $tabs.empty();
    var items = [{ key: 'all', label: 'All' }, { key: 'selected', label: 'Selected' }]
      .concat(contentTopics());
    items.forEach(function(t) {
      var $chip = $('<button type="button" class="button publication-tab landscape-legend-item"></button>')
        .attr('data-topic', t.key);
      if (t.color) {
        $('<span class="legend-swatch"></span>').css('background', t.color).appendTo($chip);
      }
      $('<span></span>').text(t.label).appendTo($chip);
      $tabs.append($chip);
    });
  }

  function setActiveTopic(key) {
    landscapeState.topic = key;
    $('#publication-tabs .publication-tab').removeClass('active');
    $('#publication-tabs .publication-tab[data-topic="' + key + '"]').addClass('active');
    var svg = landscapeState.svg;
    if (svg) {
      var focused = (key !== 'all' && key !== 'selected');
      svg.selectAll('.lm-region')
        .classed('lm-region-active', function() { return focused && d3.select(this).attr('data-topic') === key; })
        .classed('lm-region-dim', function() { return focused && d3.select(this).attr('data-topic') !== key; });
      svg.selectAll('.lm-dot').classed('lm-dot-dim', function(d) {
        if (key === 'all') return false;
        if (key === 'selected') return !d.paper.selected;
        return d.ts.indexOf(key) < 0;
      });
    }
    renderPublications(key);
  }

  function buildPublications() {
    if (!window.PUBLICATIONS || !window.PUBLICATION_TOPICS || !$('#publication-list').length) {
      return;
    }
    buildLegend();
    buildLandscapeMap();
    $('#publication-tabs').off('click', '.publication-tab').on('click', '.publication-tab', function() {
      setActiveTopic($(this).data('topic'));
    });
    setActiveTopic('selected');
  }


  init();

});
