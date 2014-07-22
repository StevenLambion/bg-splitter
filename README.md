# Angular pane splitter

Simple pane splitter for angular.js 

## Sample

HTML:
```html
<bg-splitter orientation="vertical" pos="25%" size="6" id="split1">
    <bg-pane min-size="100" id="split1pane1"><div class="pane-container">Pane 1</div></bg-pane>
    <bg-pane min-size="150" id="split1pane2">
        <bg-splitter orientation="horizontal" pos="-200" size="3" id="split2">
            <bg-pane min-size="100" id="split2pane1" class="pane-container">Pane 2</bg-pane>
            <bg-pane min-size="150" id="split2pane2">
                <bg-splitter orientation="vertical" pos="-300" id="split3">
                    <bg-pane min-size="100" id="split3pane1" class="pane-container">Pane 3</bg-pane>
                    <bg-pane min-size="150" id="split3pane2" class="pane-container">Pane 4</bg-pane>
                </bg-splitter>
            </bg-pane>
        </bg-splitter>
    </bg-pane>
</bg-splitter>
```

Javascript:
```javascript
var app = angular.module('myApp', ['bgDirectives']);
```
CSS: 
```css
    .pane-container
    {
      padding: 10px;
      box-sizing: border-box;
    }
  
```
## Install using bower

```
bower install bg-splitter
```

## Licence

The MIT License

Copyright (c) 2013 blackgate, https://github.com/blackgate

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
