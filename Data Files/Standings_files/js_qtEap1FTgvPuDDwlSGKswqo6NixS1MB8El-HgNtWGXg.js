/**
 * @file
 * Simple responsification of menus.
 */
(function ($) {
  /**
   * Handle clicks & toggling the menu.
   */
  var toggler_click = function() {
    $(this).parent().toggleClass('responsive-toggled');
  };
  /**
   * Unbind other mouse events on the menu items.
   *
   * @todo
   *   Not sure if it works 100%.
   *   Doesn't restore binds when out-of-responsive (if window dragging).
   */
  function remove_mouse_events(menuElement) {
    // Determine jQuery version and what disable options we have.
    var jqVersion = $.fn.jquery;
    if (jqVersion < 1.7) {
      $(menuElement).die('mouseover mouseout mouseenter mouseleave');
      $(menuElement + ' li').die('mouseover mouseout mouseenter mouseleave');
      $(menuElement + ' li a').die('mouseover mouseout mouseenter mouseleave');
    }
    else {
      $(menuElement).off('hover');
      $(menuElement + ' li').off('hover');
      $(menuElement + ' li a').off('hover');
    }
    $(menuElement).unbind('mouseover mouseout mouseenter mouseleave');
    $(menuElement + ' li').unbind('mouseover mouseout mouseenter mouseleave');
    $(menuElement + ' li a').unbind('mouseover mouseout mouseenter mouseleave');
  }

  /**
   * Store classes & IDs for restoring later (if window dragging).
   */
  function store_classes_ids(menuElement) {
    if (!$(menuElement).attr('id')) {
      $(menuElement).attr('id', 'rm-no-id-main');
    }
    if (!$(menuElement).attr('class')) {
      $(menuElement).attr('class', 'rm-no-class');
    }
    $(menuElement).data('removeattr', true)
      .data('rmids', $(menuElement).attr('id'))
      .data('rmclasses', $(menuElement).attr('class'));
    // Handle ULs if selector is parent div.
    var incr = 0;
    $(menuElement).find('ul').each(function() {
      incr++;
      // Prevent error if there is no id.
      if (!$(this).attr('id')) {
        $(this).attr('id', 'rm-no-id-' + incr);
      }
      // Prevent error if there is no class.
      if (!$(this).attr('class')) {
        $(this).attr('class', 'rm-no-class');
      }
      $(this).data('removeattr', true)
        .data('rmids', $(this).attr('id'))
        .data('rmclasses', $(this).attr('class'));
    });
    // Finally, add our class to the parent.
    $(menuElement).addClass('responsive-menus-simple');
  }

  /**
   * Remove classes & IDs from original menu for easier theming.
   */
  function remove_classes_ids(menuElement) {
    // Handle ULs if selector is parent div.
    $(menuElement).find('ul').each(function() {
      $(this).attr('class', 'rm-removed').attr('id', 'rm-removed');
    });
    // Remove classes/IDs.
    $(menuElement).attr('class', 'responsive-menus-simple').attr('id', 'rm-removed');
  }

  // Iterate through selectors, check window sizes, add some classes.
  Drupal.behaviors.responsive_menus = {
    attach: function (context, settings) {
      settings.responsive_menus = settings.responsive_menus || {};
      $('body').once('responsive-menus-load', function() {
        // Only doing this themes that don't include a viewport attribute.
        // e.g. Bartik for testing out-of-the-box... yeah, stupid.
        if (!$('meta[name=viewport]').length > 0) {
          $('head').append('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
        }
        // Window width with legacy browsers.
        var windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        $.each(settings.responsive_menus, function(ind, iteration) {
          if (iteration.responsive_menus_style != 'responsive_menus_simple') {
            return true;
          }
          if (!iteration.selectors.length) {
            return true;
          }
          var $media_unit = iteration.media_unit || 'px';
          if ($media_unit === 'em') {
            var $base_font_size = parseFloat($('body').css('font-size'));
            var $media_size = iteration.media_size * $base_font_size || 768;
          }
          else {
            var $media_size = iteration.media_size || 768;
          }

          // Handle clicks & toggling.
          var toggler_class = '';
          var toggler_text = iteration.toggler_text;
          // Iterate through our selectors.
          $.each(iteration.selectors, function(index, value) {
            // Stop if there is no menu element.
            if ($(value).length < 1) {
              return true;
            }
            // Handle nested menus.  Make sure we get the first, but not children.
            if ($(value).length > 1) {
              $(value).each(function(val_index) {
                if (!$(this).parents('ul').length) {
                  if (!$(this).hasClass('responsive-menus-simple')) {
                    toggler_class = 'responsive-menus-' + ind + '-' + index + '-' + val_index;
                    // Store classes & IDs before removing.
                    if (iteration.remove_attributes) {
                      store_classes_ids(this);
                    }
                    $(this).wrap('<div data-mediasize="' + $media_size + '" class="responsive-menus ' + toggler_class + '" />');
                    $('.' + toggler_class).prepend('<span class="toggler">' + toggler_text + '</span>');
                    $('.' + toggler_class + ' .toggler').bind('click', toggler_click);
                    // Unbind other mouse events.
                    if (iteration.disable_mouse_events) {
                      //$(this).data('disablemouse', true);
                      remove_mouse_events(this);
                    }
                    // Use absolute positioning.
                    if (iteration.absolute) {
                      $('.' + toggler_class).addClass('absolute');
                    }
                    // Handle first size check.
                    if (windowWidth <= $media_size) {
                      // Remove attributes setting.
                      if (iteration.remove_attributes) {
                        remove_classes_ids(this);
                      }
                      $('.' + toggler_class).addClass('responsified');
                    }
                  }
                }
              });
            }
            else {
              // Single level menus.
              if (!$(value).hasClass('responsive-menus-simple')) {
                toggler_class = 'responsive-menus-' + ind + '-' + index;
                // Store classes & IDs before removing.
                if (iteration.remove_attributes) {
                  store_classes_ids(value);
                }
                $(value).wrap('<div data-mediasize="' + $media_size + '" class="responsive-menus ' + toggler_class + '" />');
                $('.' + toggler_class).prepend('<span class="toggler">' + toggler_text + '</span>');
                $('.' + toggler_class + ' .toggler').bind('click', toggler_click);
                // Unbind other mouse events.
                if (iteration.disable_mouse_events) {
                  // @todo For rebinding mouse events.
                  /*if ($(value + ' li a').data('events')) {
                    $(value).data('tmpevents', $(value + ' li a').data('events'));
                  }*/
                  remove_mouse_events(value);
                }
                // Use absolute positioning.
                if (iteration.absolute) {
                  $('.' + toggler_class).addClass('absolute');
                }
                // Handle first size check.
                if (windowWidth <= $media_size) {
                  // Remove attributes setting.
                  if (iteration.remove_attributes) {
                    remove_classes_ids(value);
                  }
                  $('.' + toggler_class).addClass('responsified');
                }
              }
            }
          });
       });
        // Handle window resizing.
        $(window).resize(function() {
          // Window width with legacy browsers.
          windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
          $('.responsive-menus').each(function(menuIndex, menuValue) {
            var mediasize = $(this).data('mediasize') || 768;
            // Prevent menu from going off the screen.  This only happens in
            // non-responsive themes (like Bartik default), but it looks bad.
            if ($(this).width() > windowWidth) {
              $(this).data('nonresponsive', true);
              $(this).width(windowWidth);
            }
            var menuElement = $(this).find('.responsive-menus-simple');
            if (windowWidth >= mediasize) {
              if (menuElement.data('removeattr')) {
                menuElement.addClass(menuElement.data('rmclasses'));
                menuElement.attr('id', menuElement.data('rmids'));
                menuElement.find('ul').each(function() {
                  $(this).addClass($(this).data('rmclasses'));
                  $(this).attr('id', $(this).data('rmids'));
                });
              }
              $(this).removeClass('responsified');
            }
            if (windowWidth <= mediasize) {
              // Now fix repercussions for handling non-responsive themes above.
              // Stretch width back out w/ the screen.
              if ($(this).data('nonresponsive') && $(this).width() < windowWidth) {
                $(this).width(windowWidth);
              }
              if (menuElement.data('removeattr')) {
                remove_classes_ids(menuElement);
              }
              $(this).addClass('responsified');
            }
          });
        });
      });
    }
  };

}(jQuery));
;
(function ($) {

Drupal.googleanalytics = {};

$(document).ready(function() {

  // Attach mousedown, keyup, touchstart events to document only and catch
  // clicks on all elements.
  $(document.body).bind("mousedown keyup touchstart", function(event) {

    // Catch the closest surrounding link of a clicked element.
    $(event.target).closest("a,area").each(function() {

      // Is the clicked URL internal?
      if (Drupal.googleanalytics.isInternal(this.href)) {
        // Skip 'click' tracking, if custom tracking events are bound.
        if ($(this).is('.colorbox') && (Drupal.settings.googleanalytics.trackColorbox)) {
          // Do nothing here. The custom event will handle all tracking.
          //console.info("Click on .colorbox item has been detected.");
        }
        // Is download tracking activated and the file extension configured for download tracking?
        else if (Drupal.settings.googleanalytics.trackDownload && Drupal.googleanalytics.isDownload(this.href)) {
          // Download link clicked.
          ga("send", {
            "hitType": "event",
            "eventCategory": "Downloads",
            "eventAction": Drupal.googleanalytics.getDownloadExtension(this.href).toUpperCase(),
            "eventLabel": Drupal.googleanalytics.getPageUrl(this.href),
            "transport": "beacon"
          });
        }
        else if (Drupal.googleanalytics.isInternalSpecial(this.href)) {
          // Keep the internal URL for Google Analytics website overlay intact.
          ga("send", {
            "hitType": "pageview",
            "page": Drupal.googleanalytics.getPageUrl(this.href),
            "transport": "beacon"
          });
        }
      }
      else {
        if (Drupal.settings.googleanalytics.trackMailto && $(this).is("a[href^='mailto:'],area[href^='mailto:']")) {
          // Mailto link clicked.
          ga("send", {
            "hitType": "event",
            "eventCategory": "Mails",
            "eventAction": "Click",
            "eventLabel": this.href.substring(7),
            "transport": "beacon"
          });
        }
        else if (Drupal.settings.googleanalytics.trackOutbound && this.href.match(/^\w+:\/\//i)) {
          if (Drupal.settings.googleanalytics.trackDomainMode !== 2 || (Drupal.settings.googleanalytics.trackDomainMode === 2 && !Drupal.googleanalytics.isCrossDomain(this.hostname, Drupal.settings.googleanalytics.trackCrossDomains))) {
            // External link clicked / No top-level cross domain clicked.
            ga("send", {
              "hitType": "event",
              "eventCategory": "Outbound links",
              "eventAction": "Click",
              "eventLabel": this.href,
              "transport": "beacon"
            });
          }
        }
      }
    });
  });

  // Track hash changes as unique pageviews, if this option has been enabled.
  if (Drupal.settings.googleanalytics.trackUrlFragments) {
    window.onhashchange = function() {
      ga("send", {
        "hitType": "pageview",
        "page": location.pathname + location.search + location.hash
      });
    };
  }

  // Colorbox: This event triggers when the transition has completed and the
  // newly loaded content has been revealed.
  if (Drupal.settings.googleanalytics.trackColorbox) {
    $(document).bind("cbox_complete", function () {
      var href = $.colorbox.element().attr("href");
      if (href) {
        ga("send", {
          "hitType": "pageview",
          "page": Drupal.googleanalytics.getPageUrl(href)
        });
      }
    });
  }

});

/**
 * Check whether the hostname is part of the cross domains or not.
 *
 * @param string hostname
 *   The hostname of the clicked URL.
 * @param array crossDomains
 *   All cross domain hostnames as JS array.
 *
 * @return boolean
 */
Drupal.googleanalytics.isCrossDomain = function (hostname, crossDomains) {
  /**
   * jQuery < 1.6.3 bug: $.inArray crushes IE6 and Chrome if second argument is
   * `null` or `undefined`, https://bugs.jquery.com/ticket/10076,
   * https://github.com/jquery/jquery/commit/a839af034db2bd934e4d4fa6758a3fed8de74174
   *
   * @todo: Remove/Refactor in D8
   */
  if (!crossDomains) {
    return false;
  }
  else {
    return $.inArray(hostname, crossDomains) > -1 ? true : false;
  }
};

/**
 * Check whether this is a download URL or not.
 *
 * @param string url
 *   The web url to check.
 *
 * @return boolean
 */
Drupal.googleanalytics.isDownload = function (url) {
  var isDownload = new RegExp("\\.(" + Drupal.settings.googleanalytics.trackDownloadExtensions + ")([\?#].*)?$", "i");
  return isDownload.test(url);
};

/**
 * Check whether this is an absolute internal URL or not.
 *
 * @param string url
 *   The web url to check.
 *
 * @return boolean
 */
Drupal.googleanalytics.isInternal = function (url) {
  var isInternal = new RegExp("^(https?):\/\/" + window.location.host, "i");
  return isInternal.test(url);
};

/**
 * Check whether this is a special URL or not.
 *
 * URL types:
 *  - gotwo.module /go/* links.
 *
 * @param string url
 *   The web url to check.
 *
 * @return boolean
 */
Drupal.googleanalytics.isInternalSpecial = function (url) {
  var isInternalSpecial = new RegExp("(\/go\/.*)$", "i");
  return isInternalSpecial.test(url);
};

/**
 * Extract the relative internal URL from an absolute internal URL.
 *
 * Examples:
 * - https://mydomain.com/node/1 -> /node/1
 * - https://example.com/foo/bar -> https://example.com/foo/bar
 *
 * @param string url
 *   The web url to check.
 *
 * @return string
 *   Internal website URL
 */
Drupal.googleanalytics.getPageUrl = function (url) {
  var extractInternalUrl = new RegExp("^(https?):\/\/" + window.location.host, "i");
  return url.replace(extractInternalUrl, '');
};

/**
 * Extract the download file extension from the URL.
 *
 * @param string url
 *   The web url to check.
 *
 * @return string
 *   The file extension of the passed url. e.g. "zip", "txt"
 */
Drupal.googleanalytics.getDownloadExtension = function (url) {
  var extractDownloadextension = new RegExp("\\.(" + Drupal.settings.googleanalytics.trackDownloadExtensions + ")([\?#].*)?$", "i");
  var extension = extractDownloadextension.exec(url);
  return (extension === null) ? '' : extension[1];
};

})(jQuery);
;
