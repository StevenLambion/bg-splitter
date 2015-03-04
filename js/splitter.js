/* global angular:true */
angular.module('bgDirectives', [])
    .service('bgSplitterStyles', ['$document', '$q', function($document, $q)
    {
        var styleRules = {
            horizontal: {
                splitter: {},
                border: {}
            },
            vertical: {
                splitter: {},
                border: {}
            }
        };

        var rulesLoadedPromise = $q(function(resolve)
        {
            // Wait until stylesheets have loaded before attempting to parse them.
            $document.on('load', function()
            {
                var styleRulePatterns = {
                    horizontal: {
                        splitter: /\.split-panes\.horizontal\s*>\s*\.split-handler\b/,
                        border: /\.split-panes\.horizontal\s*>\s*\.split-pane2\b/
                    },
                    vertical: {
                        splitter: /\.split-panes\.vertical\s*>\s*\.split-handler\b/,
                        border: /\.split-panes\.vertical\s*>\s*\.split-pane2\b/
                    }
                };

                // Iterate over the rules in each stylesheet, finding ones that match splitters and borders.
                var sheets = $document[0].styleSheets;
                for(var i = 0, l = sheets.length; i < l; i++)
                {
                    var sheet = sheets[i];
                    if(!sheet.cssRules)
                    {
                        continue;
                    }
                    for(var j = 0, cssRulesLen = sheet.cssRules.length; j < cssRulesLen; j++)
                    {
                        var rule = sheet.cssRules[j];
                        if(!rule.selectorText)
                        {
                            continue;
                        }
                        var selectors = rule.selectorText.split(',');
                        for(var k = 0, selectorsLen = sheet.cssRules.length; k < selectorsLen; k++)
                        {
                            var selector = selectors[j];
                            if(styleRulePatterns.horizontal.splitter.test(selector))
                                { styleRulePatterns.horizontal.splitter = rule.style; }
                            else if(styleRulePatterns.horizontal.border.test(selector))
                                { styleRulePatterns.horizontal.border = rule.style; }
                            else if(styleRulePatterns.vertical.splitter.test(selector))
                                { styleRulePatterns.vertical.splitter = rule.style; }
                            else if(styleRulePatterns.vertical.border.test(selector))
                                { styleRulePatterns.vertical.border = rule.style; }
                        }
                    }
                }

                resolve(styleRules);
            });
        });

        return {
            // The loaded style rules, or placeholder objects if styles haven't finished loading yet
            rules: styleRules,

            // A promise for when style rules have finished loading
            loaded: rulesLoadedPromise
        };
    }])

    .directive('bgSplitter', ['$document', 'bgSplitterStyles', function($document, styles)
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
        controllerAs: 'bgSplitterCtrl',
        controller: ['$scope', function(scope)
        {
            var self = this;
            this.scope = scope;
            this.panes = [];

            this.addPane = function(pane)
            {
                if (self.panes.length > 1)
                {
                   throw 'splitters can only have two panes';
                }
                self.panes.push(pane);
                return self.panes.length;
            };

            var orientation = this.scope.orientation;
            var isVertical = this.scope.isVertical = orientation == 'vertical';

            function onStyleChange(rules)
            {
                // get the size of the splitter from the pane2 border and its hitzone from split-handler
                var borderStyle = rules[orientation].border;
                var border = (isVertical? borderStyle['border-left']: borderStyle['border-top']) || '';
                var sizePx = border.split(' ')[0];
                var splitterSize = parseInt(sizePx.substring(0, sizePx.indexOf('px')));

                // adjust handler size
                if (scope.size)
                {
                    splitterSize = Number(scope.size);
                }

                scope.splitterSize = splitterSize;
            }

            styles.loaded.then(onStyleChange);
            onStyleChange(styles.rules);
        }],
        link: {
            pre: function preLink(scope, element, attrs, bgPane)
            {
                function calcSizes(width, height)
                {
                    scope.width = width;
                    scope.height = height;

                    scope.paneSizes = [];
                    var range = scope.isVertical ? width : height;
                    var val = 0;

                    var pos = scope.pos || "50%";


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
                var width;
                var height;
                if (bgPane)
                {
                    width = bgPane.scope.paneSize[0];
                    height = bgPane.scope.paneSize[1];
                    calcSizes(width, height);
                }
                else
                {
                    var bounds = element[0].getBoundingClientRect();
                    width = bounds.right - bounds.left;
                    height = bounds.bottom - bounds.top;
                    calcSizes(width, height);
                }
            },
            post: function postLink (scope, element)
            {
                var self = scope.bgSplitterCtrl;

                var handler = angular.element('<div class="split-handler"></div>');
                var pane1 = self.panes[0];
                var pane2 = self.panes[1];
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
                $document[0].addEventListener('mouseup', function () {
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

                function onStyleChange(rules)
                {
                    var splitterStyle = rules[scope.orientation].border;

                    var ssSizePx = (scope.isVertical ? splitterStyle.width : splitterStyle.height) || '';
                    var splitterHitSize = parseInt(ssSizePx.substring(0, ssSizePx.indexOf('px')));

                    if (splitterHitSize < scope.splitterSize)
                    {
                        splitterHitSize = scope.splitterSize;
                        if (scope.isVertical)
                        {
                            handler[0].style.width = splitterHitSize + 'px';
                        }
                        else
                        {
                            handler[0].style.height = splitterHitSize + 'px';
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
                }

                styles.loaded.then(onStyleChange);
                onStyleChange(styles.rules);
            }// end postLink
        }
    };
  }])
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
            controllerAs: 'bgPaneCtrl',
            controller: ['$scope', function(scope)
            {
                this.scope = scope;
            }],
            link: {
                pre: function preLink(scope, element, attrs, bgSplitter)
                {
                    var self = scope.bgPaneCtrl;

                    // get dimensions from bgSplitter
                    self.elem = element;
                    self.id = attrs.id;
                    scope.index = bgSplitter.addPane(self);
                    scope.paneSize = bgSplitter.scope.paneSizes[scope.index - 1];
                }
            }
        };
    });
