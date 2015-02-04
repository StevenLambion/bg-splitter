angular.module('bgDirectives', [])
    .directive('bgSplitter', function()
    {
        return {
            restrict: 'E',
            require: '?^bgPane',
            replace: true,
            transclude: true,
            scope: {
                orientation: '@',
                pos: '@',
                size: '@'
        },
        template: '<div class="split-panes {{orientation}}" ng-transclude></div>',
        controller: ['$scope', '$element', '$attrs', function (scope, element, attrs)
        {
            this.scope = scope;
            scope.panes = [];

            this.addPane = function(pane)
            {
                if (scope.panes.length > 1)
                {
                   throw 'splitters can only have two panes';
                }
                scope.panes.push(pane);
                return scope.panes.length;
            };

            scope.getStyleRule = function(selector, sheet)
            {
                var sheets = typeof sheet !== 'undefined' ? [sheet] : document.styleSheets;
                for (var i = 0, l = sheets.length; i < l; i++)
                {
                    var sheet = sheets[i];
                    if( !sheet.cssRules )
                    {
                        continue;
                    }
                    for (var j = 0, k = sheet.cssRules.length; j < k; j++)
                    {
                        var rule = sheet.cssRules[j];
                        if (rule.selectorText && rule.selectorText.split(',').indexOf(selector) !== -1)
                        {
                            return rule.style;
                        }
                    }
                }
                return null;
            }

            var orientation = this.scope.orientation;
            var isVertical = this.scope.isVertical = orientation == 'vertical';

            // get the size of the splitter from the pane2 border and its hitzone from split-handler
            var borderStyle = scope.getStyleRule('.split-panes.'+ orientation +' > .split-pane2');
            var border = isVertical? borderStyle['border-left']: borderStyle['border-top'];
            var sizePx = border.split(' ')[0];
            var splitterSize = parseInt(sizePx.substring(0, sizePx.indexOf('px')));


            // adjust handler size
            if (this.scope.size)
            {
                splitterSize = Number(scope.size);
            }

            this.scope.splitterSize = splitterSize;
        }],
        link: {
            pre: function preLink(scope, element, attrs, bgPane)
            {
                function calcSizes(scope, width, height)
                {
                    scope.width = width;
                    scope.height = height;

                    scope.paneSizes = [];
                    var range = scope.isVertical ? width : height;
                    var val = 0;

                    var pos = scope.pos;

                    if (pos == null)
                    {
                        pos = "50%";
                    }


                    if (pos.indexOf('%') != -1)
                    {
                        // handle percent
                        var posStr = pos.substring(0, pos.indexOf('%'));
                        var fraction = Number(posStr) / 100;

                        val = range * fraction | 0;
                        val = val < 0 ? range + val - scope.splitterSize : val;
                    }
                    else
                    {
                        // handle pixels
                        var pixels = parseInt(pos);
                        val = pixels < 0 ? range + pixels - scope.splitterSize: pixels;
                    }

                    if (scope.isVertical)
                    {
                        scope.paneSizes.push([val, height], [width - val, height]);
                        scope.startX = val;
                    }
                    else
                    {
                        scope.paneSizes.push([width, val], [width, height - val]);
                        scope.startY = val;
                    }
                }

                // calculate the width and height of each pane
                if (bgPane)
                {
                    var width = bgPane.scope.paneSize[0];
                    var height = bgPane.scope.paneSize[1];
                    calcSizes(scope, width, height);
                }
                else
                {
                    var bounds = element[0].getBoundingClientRect();
                    var width = bounds.right - bounds.left;
                    var height = bounds.bottom - bounds.top;
                    calcSizes(scope, width, height);
                }
            },
            post: function postLink (scope, element, attrs, bgPane)
            {
                var handler = angular.element('<div class="split-handler"></div>');
                var pane1 = scope.panes[0];
                var pane2 = scope.panes[1];
                var pane1Min = pane1.minSize || 0;
                var pane2Min = pane2.minSize || 0;
                var drag = false;

                pane1.elem.after(handler);


                function resize (ev)
                {
                    if (!drag) return;

                    var bounds = element[0].getBoundingClientRect();
                    var pos = 0;

                    if (scope.isVertical)
                    {
                        var width = bounds.right - bounds.left;
                        pos = ev.clientX - bounds.left;

                        if (pos < pane1Min) pos = pane1Min;
                        if (width - pos < pane2Min) pos = width - pane2Min;

                        handler.css('left', pos + 'px');
                        pane1.elem.css('width', pos + 'px');
                        pane2.elem.css('left', pos + 'px');

                    } else {
                        var height = bounds.bottom - bounds.top;
                        pos = ev.clientY - bounds.top;

                        if (pos < pane1Min) pos = pane1Min;
                        if (height - pos < pane2Min) pos = height - pane2Min;

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

                // Use .addEventListener() instead of JQuery-lite's .bind() so we get mouseup before anything eats it.
                document.addEventListener('mouseup', function (ev) {
                    drag = false;
                }, true);

                // adjust the splitter size
                if (scope.size)
                {
                    if (scope.isVertical)
                    {
                        pane2.elem[0].style['border-left-width'] = scope.splitterSize + 'px';
                    }
                    else
                    {
                        pane2.elem[0].style['border-top-width'] = scope.splitterSize + 'px';
                    }
                }

                var splitterStyle = scope.getStyleRule('.split-panes.'+ scope.orientation +' > .split-handler');
                var ssSizePx = scope.isVertical ? splitterStyle['width'] : splitterStyle['height'];
                var splitterHitSize = parseInt(ssSizePx.substring(0, ssSizePx.indexOf('px')));

                if (splitterHitSize < scope.splitterSize)
                {
                    splitterHitSize = scope.splitterSize;
                    if (scope.isVertical)
                    {
                        handler[0].style['width'] = splitterHitSize + 'px';
                    }
                    else
                    {
                        handler[0].style['height'] = splitterHitSize + 'px';
                    }
                }

                // initialize splitter and pane positions
                if (scope.isVertical)
                {
                    var startX = scope.startX;
                    if (startX < pane1Min) return;
                    if (scope.width - startX < pane2Min) return;

                    handler.css('left', startX + 'px');
                    pane1.elem.css('width', startX + 'px');
                    pane2.elem.css('left', startX + 'px');

                } else {
                    var startY = scope.startY;
                    if (startY < pane1Min) return;
                    if (scope.height - startY < pane2Min) return;

                    handler.css('top', startY + 'px');
                    pane1.elem.css('height', startY + 'px');
                    pane2.elem.css('top', startY + 'px');
                }
            }// end postLink
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
            controller: ['$scope', '$element', '$attrs',function(scope, element, attrs)
            {
                this.scope = scope;
                scope.id = attrs.id;
            }],
            link: {
                pre: function preLink(scope, element, attrs, bgSplitterCtrl)
                {
                    // get dimensions from bgSplitter
                    scope.elem = element;
                    scope.id = attrs.id;
                    scope.index = bgSplitterCtrl.addPane(scope);
                    scope.paneSize = bgSplitterCtrl.scope.paneSizes[scope.index - 1];
                },
                post: function(scope, element, attrs, bgSplitterCtrl) {
                }
            }
        }
    });
