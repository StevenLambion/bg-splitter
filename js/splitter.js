angular.module('bgDirectives', [])
  .directive('bgSplitter', function() {
    return {
      restrict: 'E',
      replace: true,
      transclude: true,
      scope: {
        orientation: '@',
        pos: '@',
        size: '@'
      },      
      template: '<div class="split-panes {{orientation}}" ng-transclude></div>',
      controller: function ($scope) {
        $scope.panes = [];

        this.addPane = function(pane){
          if ($scope.panes.length > 1) 
            throw 'splitters can only have two panes';
          $scope.panes.push(pane);
          return $scope.panes.length;
        };
      },
      link: function(scope, element, attrs) {
        var handler = angular.element('<div class="split-handler"></div>');
        var pane1 = scope.panes[0];
        var pane2 = scope.panes[1];
        var vertical = scope.orientation == 'vertical';
        var pane1Min = pane1.minSize || 0;
        var pane2Min = pane2.minSize || 0;
        var drag = false;
        
        pane1.elem.after(handler);


        function getStyleRule(selector, sheet) {
            var sheets = typeof sheet !== 'undefined' ? [sheet] : document.styleSheets;
            for (var i = 0, l = sheets.length; i < l; i++) {
                var sheet = sheets[i];
                if( !sheet.cssRules ) { continue; }
                for (var j = 0, k = sheet.cssRules.length; j < k; j++) {
                    var rule = sheet.cssRules[j];
                    if (rule.selectorText && rule.selectorText.split(',').indexOf(selector) !== -1) {
                        return rule.style;
                    }
                }
            }
            return null;
        }

        // get the size of the splitter from the pane2 border and its hitzone from split-handler
        var borderStyle = getStyleRule('.split-panes.'+ scope.orientation +' > .split-pane2');

        var border = vertical? borderStyle['border-left']: borderStyle['border-top'];
        var sizePx = border.split(' ')[0];
        var splitterSize = parseInt(sizePx.substring(0, sizePx.indexOf('px')));


        var splitterStyle = getStyleRule('.split-panes.'+scope.orientation+' > .split-handler');
        var ssSizePx = vertical ? splitterStyle['width'] : splitterStyle['height'];
        var splitterHitSize = parseInt(ssSizePx.substring(0, ssSizePx.indexOf('px')));

        // adjust handler size
        if (scope.size)
        {
            splitterSize = Number(scope.size);
            
            if (vertical)
            {
                borderStyle['border-left-width'] = splitterSize + 'px';
            }
            else
            {
                borderStyle['border-top-width'] = splitterSize + 'px';
            }
        }

        if (splitterHitSize < splitterSize)
        {
            splitterHitSize = splitterSize;
            if (vertical)
            {
                splitterStyle['width'] = splitterHitSize + 'px';
            }
            else
            {
                splitterStyle['height'] = splitterHitSize + 'px';
            }
        }

        function resize (ev) {
          if (!drag) return;
          
          var bounds = element[0].getBoundingClientRect();
          var pos = 0;
          
          if (vertical) {
            var width = bounds.right - bounds.left;
            pos = ev.clientX - bounds.left;

            if (pos < pane1Min) return;
            if (width - pos < pane2Min) return;

            handler.css('left', pos + 'px');
            pane1.elem.css('width', pos + 'px');
            pane2.elem.css('left', pos + 'px');
      
          } else {
            var height = bounds.bottom - bounds.top;
            pos = ev.clientY - bounds.top;

            if (pos < pane1Min) return;
            if (height - pos < pane2Min) return;

            handler.css('top', pos + 'px');
            pane1.elem.css('height', pos + 'px');
            pane2.elem.css('top', pos + 'px');
          }
        }

        element.bind('mousemove', resize);
    
        handler.bind('mousedown', function (ev) { 
          ev.preventDefault();
          drag = true; 
        });
    
        angular.element(document).bind('mouseup', function (ev) {
          drag = false;
        });

        if (scope.pos)
        {
            // initialize handler position from pos attribute
            var bounds = element[0].getBoundingClientRect();
            var width = bounds.right - bounds.left;
            var height = bounds.bottom - bounds.top;
            var val = 0;
            var range = vertical ? width : height;

            var ev = {
                clientX: 0,
                clientY: 0
            };

            if (scope.pos.indexOf('%') != -1)
            {
                // handle percent
                var posStr = scope.pos.substring(0, scope.pos.indexOf('%'));
                var fraction = Number(posStr) / 100;

                val = range * fraction;
                val = val < 0 ? range + val - splitterSize : val;
            }
            else
            {
                // handle pixels
                var pixels = parseInt(scope.pos);
                val = pixels < 0 ? range + pixels - splitterSize: pixels;
            }

            if (vertical)
            {
                ev.clientX = val;
            }
            else
            {
                ev.clientY = val;
            }

            drag = true;
            resize(ev);
            drag = false;
        }
      }
    };
  })
  .directive('bgPane', function () {
    return {
      restrict: 'E',
      require: '^bgSplitter',
      replace: true,
      transclude: true,
      scope: {
        minSize: '='
      },
      template: '<div class="split-pane{{index}}" ng-transclude></div>',
      link: function(scope, element, attrs, bgSplitterCtrl) {
        scope.elem = element;
        scope.index = bgSplitterCtrl.addPane(scope);
      }
    };
  });
