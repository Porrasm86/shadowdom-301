(function() {
var container = document.querySelector('#example2');
var root1 = container.createShadowRoot();
var root2 = container.createShadowRoot();
root1.innerHTML = '<div>Первый корневой элемент</div><content></content>';
root2.innerHTML = '<div>Второй корневой элемент</div><shadow></shadow>';
})();