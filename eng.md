<section>
**Heads up!** This article discusses APIs that are not yet fully standardized
and still in flux. Be cautious when using experimental APIs in your own projects.

This article discusses more of the amazing things you can do with Shadow DOM!
It builds on the concepts discussed in[Shadow DOM 101][1] and 
[Shadow DOM 201][2].

## Using multiple shadow roots {#toc-shadow-multiple}

If you're hosting a party, it gets stuffy if everyone is crammed into the same
room. You want the option of distributing groups of people across multiple rooms.
Elements hosting Shadow DOM can do this too, that is to say, they can host more 
than one shadow root at a time.

Let's see what happens if we try to attach multiple shadow roots to a host:

    <div id="example1">Host node</div>
    <script>
    var container = document.querySelector('#example1');
    var root1 = container.webkitCreateShadowRoot();
    var root2 = container.webkitCreateShadowRoot();
    root1.innerHTML = '<div>Root 1 FTW</div>';
    root2.innerHTML = '<div>Root 2 FTW</div>';
    </script>
    

What renders is "Root 2 FTW", despite the fact that we had already attached a
shadow tree. This is because the last shadow tree added to a host, wins. It's a 
LIFO stack as far as rendering is concerned. Examining the DevTools verifies 
this behavior.

Shadow trees added to a host are stacked in the order they're added, starting
with the most recent first. The last one added is the one that renders.

So what's the point of using multiple shadows if only the last is invited to
the rendering party? Enter shadow insertion points.

### Shadow Insertion Points {#toc-shadow-insertion}

"Shadow insertion points" (`<shadow>`) are similar to normal 
[insertion points][3] (`<content>`) in that they're placeholders. However
, instead of being placeholders for a host's*content*, they're hosts for other*
shadow trees*. It's Shadow DOM Inception!

As you can probably imagine, things get more complicated the further you drill
down the rabbit hole. For this reason, the spec is very clear about what happens
when multiple`<shadow>` elements are in play:

If multiple `<shadow>` insertion points exist in a shadow tree, only the
first is recognized. The rest are ignored.

Looking back to our original example, the first shadow `root1` got left off the
invite list. Adding a`<shadow>` insertion point brings it back:

    <div id="example2">Host node</div>
    <script>
    var container = document.querySelector('#example2');
    var root1 = container.webkitCreateShadowRoot();
    var root2 = container.webkitCreateShadowRoot();
    root1.innerHTML = '<div>Root 1 FTW</div><content></content>';
    **root2.innerHTML = '<div>Root 2 FTW</div><shadow></shadow>';**
    </script>
    

There are a couple of interesting things about this example:

1.  "Root 2 FTW" still renders above "Root 1 FTW". This is because of where we'
    ve placed the
   `<shadow>` insertion point. If you want the reverse, move the
    insertion point:
   
    `root2.innerHTML = '<shadow></shadow><div>Root 2 FTW</div>';`
   
2.  Notice there's now a `<content>` insertion point in root1. This makes
    the text node "Host node" come along for the rendering ride.
   

**What's rendered at <shadow>?**

Sometimes it's useful to know the shadow tree that was rendered at a 
`<shadow>`. You can get a reference to that tree through 
`.olderShadowRoot`:

    **root2.querySelector('shadow').olderShadowRoot** === root1 //true
    

`.olderShadowRoot` isn't vendor prefixed because `HTMLShadowElement` only makes
sense in the context of Shadow DOM...which is already prefixed:
)

## Obtaining a host's shadow root {#toc-get-shadowroot}

If an element is hosting Shadow DOM you can access its 
[youngest shadow root][4] using `.webkitShadowRoot`:

    var root = host.webkitCreateShadowRoot();
    console.log(host.webkitShadowRoot === root); // true
    console.log(document.body.webkitShadowRoot); // null
    

If you're worried about people crossing into your shadows, redefine 
`.shadowRoot` to be null:

    Object.defineProperty(host, 'webkitShadowRoot', {
      get: function() { return null; },
      set: function(value) { }
    });

A bit of a hack, but it works. The powers that be are also looking at ways to
make Shadow DOM private.

In the end, it's important to remember that while amazingly fantastic, **Shadow
DOM wasn't designed to be a security feature**. Don't rely on it for complete
content isolation.

## Building Shadow DOM in JS {#toc-creating-js}

If you prefer building DOM in JS, `HTMLContentElement` and `HTMLShadowElement`
have interfaces for that.

    <div id="example3">
      <span>Host node</span>
    </div>
    <script>
    var container = document.querySelector('#example3');
    var root1 = container.webkitCreateShadowRoot();
    var root2 = container.webkitCreateShadowRoot();
    
    var div = document.createElement('div');
    div.textContent = 'Root 1 FTW';
    root1.appendChild(div);
    
     // HTMLContentElement
    **var content = document.createElement('content');
    content.select = 'span';** // selects any spans the host node contains
    root1.appendChild(content);
    
    var div = document.createElement('div');
    div.textContent = 'Root 2 FTW';
    root2.appendChild(div);
    
    // HTMLShadowElement
    **var shadow = document.createElement('shadow');**
    root2.appendChild(shadow);
    </script>
    

This example is nearly identical to the one in the [previous section][5]. The
only difference is that now I'm using`select` to pull out the newly added 
`<span>`.

## Fetching distributed nodes {#toc-distributed-nodes}

Nodes that are selected out of the host element and "distribute" into the
shadow tree are called...drumroll...distributed nodes! They're allowed to cross 
the shadow boundary when insertion points invite them.

What's conceptually bizarre about insertion points is that they don't
physically move DOM. The host's nodes stay intact. Insertion points merely re-
project nodes from the host into the shadow tree. It's a presentation/rendering 
thing:<s>"Move these nodes over here"</s> "Render these nodes at this location
."

You cannot traverse the DOM into a `<content>`.

For example:

    <div><h2>Host node</h2></div>
    <script>
    var shadowRoot = document.querySelector('div').webkitCreateShadowRoot();
    shadowRoot.innerHTML = '<content select="h2"></content>';
    
    var h2 = document.querySelector('h2');
    console.log(shadowRoot.querySelector('content[select="h2"] h2')); // null;
    console.log(shadowRoot.querySelector('content').contains(h2)); // false
    </script>
    

Voilà! The `h2` isn't a child of the shadow DOM. This leads to another tid bit
:

### Element.getDistributedNodes() {#toc-getDistributedNodes}

We can't traverse into a `<content>`, but the `.getDistributedNodes()`
API allows us to query the distributed nodes at an insertion point:

    <div id="example4">
      <h2>Eric</h2>
      <h2>Bidelman</h2>
      <div>Digital Jedi</div>
      <h4>footer text</h4>
    </div>
    
    <template id="sdom">
      <header>
        <content select="h2"></content>
      </header>
      <section>
        <content select="div"></content>
      </section>
      <footer>
        <content select="h4:first-of-type"></content>
      </footer>
    </template>
    
    <script>
    var container = document.querySelector('#example4');
    
    var root = container.webkitCreateShadowRoot();
    root.appendChild(document.querySelector('#sdom').content.cloneNode(true));
    
    var html = [];
    [].forEach.call(root.querySelectorAll('content'), function(el) {
      html.push(el.outerHTML + ': ');
      var nodes = el.getDistributedNodes();
      [].forEach.call(nodes, function(node) {
        html.push(node.outerHTML);
      });
      html.push('\n');
    });
    </script>
    

## Eric

## Bidelman

Digital Jedi

#### footer text

## Tool: Shadow DOM Visualizer {#toc-shadow-visualizder}

Understanding the black magic that is Shadow DOM is difficult. I remember
trying to wrap my head around it for the first time.

To help visualize how Shadow DOM rendering works, I've built a tool using 
[d3.js][6]. Both markup boxes on the left-hand side are editable. Feel free to
paste in your own markup and play around to see how things work and insertion 
points swizzle host nodes into the shadow tree.<figure>

![Shadow DOM Visualizer][7] <figcaption>[Launch Shadow DOM Visualizer][8]</
figcaption
></figure>


Give it a try and let me know what you think!

## Event Model {#toc-events}

Some events cross the shadow boundary and some do not. In the cases where
events cross the boundary, the event target is adjusted in order to maintain the
encapsulation that the shadow root's upper boundary provides. That is,**events
are retargeted to look like they've come from the host element rather than 
internal elements to the Shadow DOM**.

If your browser supports Shadow DOM (it doesn't), you should see a play area
below that helps visualize events. Elements inyellow are part of the Shadow DOM
's markup. Elements inblue are part of the host element. The yellow border
around "I'm a node in the host" signifies that it is a distributed node, passing
through the shadow's`<content>` insertion point.

The "Play Action" buttons show you different things to try. Give them a go to
see how the`mouseout` and `focusin` events bubble up to the main page.

<template><section class="scopestyleforolderbrowsers">
I'm a node in Shadow DOM

I'm a node in Shadow DOM<content></content>

I'm a node in Shadow DOM

I'm a node in Shadow DOM</section></template><aside class="cursor"></aside><
output
></output> 

**Play Action 1**

*   This one is interesting. You should see a `mouseout` from the host element
    (`<div data-host>`) to the blue node. Even though it's a distributed
    node, it's still in the host, not the ShadowDOM. Mousing further down into
   yellow again causes a `mouseout` on the blue node.

**Play Action 2**

*   There is one `mouseout` that appears on host (at the very end). Normally
    you'd see
   `mouseout` events trigger for all of the yellow blocks. However, in this
    case these elements are internal to the Shadow DOM and the event doesn't bubble 
    through its upper boundary.
   

**Play Action 3**

*   Notice that when you click the input, the `focusin` doesn't appear on the
    input but on the host node itself. It's been retargeted!
   

### Events that are always stopped {#toc-events-stopped}

The following events never cross the shadow boundary:

*   abort
*   error
*   select
*   change
*   load
*   reset
*   resize
*   scroll
*   selectstart

## Conclusion {#toc-conclusion}

I hope you'll agree that **Shadow DOM is incredibly powerful**. For the first
time ever, we have proper encapsulation without the extra baggage of
`<iframe>`s or other older techniques. 

Shadow DOM is certainly complex beast, but it's a beast worth adding to the web
platform. Spend some time with it. Learn it. Ask questions.

If you want to learn more, see Dominic's intro article [Shadow DOM 101][1] and
my[Shadow DOM 201: CSS & Styling][2] article.

Thanks to [Dominic Cooney][9] and [Dimitri Glazkov][10] for reviewing the
content of this tutorial.</section>

 [1]: http://www.html5rocks.com/tutorials/webcomponents/shadowdom/
 [2]: http://www.html5rocks.com/tutorials/webcomponents/shadowdom-201/

 [3]: http://www.html5rocks.com/tutorials/webcomponents/shadowdom/#toc-separation-separate

 [4]: http://www.html5rocks.com/en/tutorials/webcomponents/shadowdom-301/#youngest-tree

 [5]: http://www.html5rocks.com/en/tutorials/webcomponents/shadowdom-301/#toc-shadow-insertion
 [6]: http://d3js.org/
 [7]: img/visualizer.png "Shadow DOM Visualizer"
 [8]: http://html5-demos.appspot.com/static/shadowdom-visualizer/index.html
 [9]: http://www.html5rocks.com/profiles/#dominiccooney
 [10]: https://plus.google.com/111648463906387632236/posts