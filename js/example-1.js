(function() {
var container = document.querySelector('#example1');
var root1 = container.createShadowRoot();
var root2 = container.createShadowRoot();
root1.innerHTML = '<div>Первый корневой элемент</div>';
root2.innerHTML = '<div>Второй корневой элемент</div>';
})();
