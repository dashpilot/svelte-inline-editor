<svelte:head>
<style>
.editing {
   background-color: #FFF3CD;
   transition: background-color .3s linear;
}
.editing.done {
   background-color: transparent;
}
.editable:hover{
  background-color: #FFF3CD;
}
</style>
</svelte:head>

<script>
export let data;
let editing = false;

function edit(){
  document.querySelectorAll('.edit').forEach(function(e){
    console.log('ok')
    e.contentEditable = true;
    e.classList.add('editing');
    window.setTimeout(function(){
      e.classList.add('done');
    }, 300)
  })
  editing = true;
}
function save(){
  document.querySelectorAll('.edit').forEach(function(e){
    console.log('ok')
    e.contentEditable = false;
    e.classList.remove('editing');
    e.classList.remove('done');
  })
  editing = false;

  localStorage.setItem('mydata', JSON.stringify(data));
}

function clear(){
  var r = confirm("Are you sure you want to start over?");
  if (r == true) {
    localStorage.removeItem('mydata');
    location.reload();
  }
}

function addItem(layout){
  let newItem = {id: "item-"+Date.now(), title: "Lorem ipsum", content: "Lorem ipsum dolor site amet", layout: layout}
  data.entries.push(newItem);
  data = data;
  UIkit.offcanvas('#add-item').hide()
}

function deleteItem(id){
	var r = confirm("Are you sure you want to delete this item?");
	if (r == true) {
	let curIndex = data.entries.findIndex(x => x.id == id);
	data.entries.splice(curIndex, 1);
	data = data;
  UIkit.modal('#manage-items').hide();
	}
}

function saveOrder(){
  var order = [];
  document.querySelectorAll('.ids').forEach(function(e){
    order.push(e.value);
  })

  console.log(order);

  data.entries = data.entries.sort(function(a, b){
    return order.indexOf(a.id) - order.indexOf(b.id)
  });

  console.log(data.entries);
  UIkit.modal('#manage-items').hide();
}
</script>

{#if editing}
<a class="uk-float-left uk-button uk-button-secondary" href="#add-item" uk-toggle><span uk-icon="plus"></span></a>
<a class="uk-float-left uk-button uk-button-primary" href="#manage-items" uk-toggle><span uk-icon="cog"></span></a>

<!--<button class="uk-float-left uk-button uk-button-secondary" on:click={addItem}><span uk-icon="plus"></span></button>
 <button class="uk-float-right uk-button uk-button-secondary" on:click={clear}>Clear</button>
 -->
<button class="uk-float-right uk-button uk-button-primary" on:click={save}>Save</button>
{:else}
<button class="float-right uk-button uk-button-primary" on:click={edit}>Edit Page</button>

{/if}
<br><br>

<div id="add-item" uk-offcanvas>
    <div class="uk-offcanvas-bar">
        <button class="uk-offcanvas-close" type="button" uk-close></button>

<br />
          {#each data.layouts as item}
          <div class="uk-card uk-card-primary uk-card-body uk-margin-bottom" on:click={() => addItem(item)}>

          <h3 class="uk-card-title">{item}</h3>
          <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit.</p>

          </div>
          {/each}

    </div>
</div>



<div id="manage-items" class="uk-flex-top" uk-modal>
    <div class="uk-modal-dialog">
      <button class="uk-modal-close-default" type="button" uk-close></button>

  <div class="uk-modal-header">
    <h4 class="uk-modal-title">Manage Page</h4>
  </div>

<div class="uk-modal-body">

   <ul class="uk-list uk-list-striped" uk-sortable="handle: .uk-sortable-handle">
      {#each data.entries as item}
       <li>
          <span class="uk-sortable-handle uk-margin-small-right uk-text-center" uk-icon="icon: table"></span>{item.title.replace(/(<([^>]+)>)/gi, "")}
          <input type="hidden" class="ids" value="{item.id}">

          <span uk-icon="trash" class="uk-float-right uk-margin-small-top" on:click="{() => deleteItem(item.id)}"></span>


       </li>
      {/each}
  </ul>

  <button class="uk-button uk-button-primary uk-float-right" on:click="{saveOrder}">Save</button>

</div>

    </div>
</div>

<deckgo-inline-editor background-color="false" align="false"></deckgo-inline-editor>
