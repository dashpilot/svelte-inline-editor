<script>
	import { onMount } from 'svelte';
	import InlineEditor from "./InlineEditor.svelte";

	export let name;

	let data = {};
	data.intro = '<h1>Lorem Ipsum</h1><div>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris porta accumsan elit eget malesuada. Cras non congue risus, ac venenatis ipsum. Sed tempus consectetur nisi, ut gravida ex tincidunt id. Nulla tempus sed lorem vitae sodales. Nullam lacinia at nisi at hendrerit. Ut interdum consectetur orci at convallis. Fusce euismod, sapien consectetur tincidunt imperdiet, sem augue euismod nisi, eu aliquet elit libero eget tellus. Curabitur nec fringilla felis, eu tempus purus. In fermentum nisl eget quam vulputate tristique. Cras sodales nec urna sed laoreet. Curabitur eu sollicitudin ex. Integer ultricies facilisis lorem, id pellentesque orci sollicitudin vitae.</div>';
	data.entries = [{
		id: "item-1",
		title: "Lorem Ipsum",
		content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
		title2: "Lorem Ipsum",
		content2: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
		layout: "two-col"
	},{
		id: "item-2",
		title: "Lorem Lila",
		content: "Lorem ipsum dolor site amet.",
		title2: "Lorem Lila",
		content2: "Lorem ipsum dolor site amet.",
		layout: "two-col"
	}];

	data.layouts = ['default', 'two-col'];

	onMount(async () => {

	if (localStorage.getItem("mydata") !== null) {
		data = JSON.parse(localStorage.getItem('mydata'));
		console.log(JSON.parse(localStorage.getItem('mydata')));
	}

	});

</script>


<div class="uk-container uk-margin-top">
<InlineEditor bind:data />

<section>
<div class="edit" contenteditable="false" bind:innerHTML={data.intro}></div>
</section>

{#each data.entries as item}

	{#if item.layout == 'two-col'}
	<section>
	<div class="uk-grid-divider uk-child-width-expand@s" uk-grid>
	    <div class="uk-text-center">
				<h2 class="edit" contenteditable="false" bind:innerHTML={item.title}></h2>
				<div class="edit" contenteditable="false" bind:innerHTML={item.content}></div>
			</div>
	    <div class="uk-text-center">
				<h2 class="edit" contenteditable="false" bind:innerHTML={item.title}></h2>
				<div class="edit"  contenteditable="false" bind:innerHTML={item.content2}></div>
			</div>
	</div>
	</section>
	{/if}

	{#if item.layout == 'default'}
	<section>

				<h2 class="edit" contenteditable="false" bind:innerHTML={item.title}></h2>
				<div class="edit" contenteditable="false" bind:innerHTML={item.content}></div>

	</section>
	{/if}

{/each}


</div>
