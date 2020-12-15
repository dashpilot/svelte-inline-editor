
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_custom_element_data(node, prop, value) {
        if (prop in node) {
            node[prop] = value;
        }
        else {
            attr(node, prop, value);
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.31.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/InlineEditor.svelte generated by Svelte v3.31.0 */

    const { console: console_1, document: document_1 } = globals;
    const file = "src/InlineEditor.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (93:0) {:else}
    function create_else_block(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Edit Page";
    			attr_dev(button, "class", "float-right uk-button uk-button-primary");
    			add_location(button, file, 93, 0, 2382);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*edit*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(93:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (85:0) {#if editing}
    function create_if_block(ctx) {
    	let a0;
    	let span0;
    	let t0;
    	let a1;
    	let span1;
    	let t1;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			a0 = element("a");
    			span0 = element("span");
    			t0 = space();
    			a1 = element("a");
    			span1 = element("span");
    			t1 = space();
    			button = element("button");
    			button.textContent = "Save";
    			attr_dev(span0, "uk-icon", "plus");
    			add_location(span0, file, 85, 82, 1915);
    			attr_dev(a0, "class", "uk-float-left uk-button uk-button-secondary");
    			attr_dev(a0, "href", "#add-item");
    			attr_dev(a0, "uk-toggle", "");
    			add_location(a0, file, 85, 0, 1833);
    			attr_dev(span1, "uk-icon", "cog");
    			add_location(span1, file, 86, 84, 2032);
    			attr_dev(a1, "class", "uk-float-left uk-button uk-button-primary");
    			attr_dev(a1, "href", "#manage-items");
    			attr_dev(a1, "uk-toggle", "");
    			add_location(a1, file, 86, 0, 1948);
    			attr_dev(button, "class", "uk-float-right uk-button uk-button-primary");
    			add_location(button, file, 91, 0, 2285);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a0, anchor);
    			append_dev(a0, span0);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, a1, anchor);
    			append_dev(a1, span1);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*save*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(a1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(85:0) {#if editing}",
    		ctx
    	});

    	return block;
    }

    // (104:10) {#each data.layouts as item}
    function create_each_block_1(ctx) {
    	let div;
    	let h3;
    	let t0_value = /*item*/ ctx[9] + "";
    	let t0;
    	let t1;
    	let p;
    	let t3;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[7](/*item*/ ctx[9]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			h3 = element("h3");
    			t0 = text(t0_value);
    			t1 = space();
    			p = element("p");
    			p.textContent = "Lorem ipsum dolor sit amet, consectetur adipisicing elit.";
    			t3 = space();
    			attr_dev(h3, "class", "uk-card-title");
    			add_location(h3, file, 106, 10, 2801);
    			add_location(p, file, 107, 10, 2849);
    			attr_dev(div, "class", "uk-card uk-card-primary uk-card-body uk-margin-bottom");
    			add_location(div, file, 104, 10, 2691);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h3);
    			append_dev(h3, t0);
    			append_dev(div, t1);
    			append_dev(div, p);
    			append_dev(div, t3);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*data*/ 1 && t0_value !== (t0_value = /*item*/ ctx[9] + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(104:10) {#each data.layouts as item}",
    		ctx
    	});

    	return block;
    }

    // (129:6) {#each data.entries as item}
    function create_each_block(ctx) {
    	let li;
    	let span0;
    	let t0_value = /*item*/ ctx[9].title.replace(/(<([^>]+)>)/gi, "") + "";
    	let t0;
    	let t1;
    	let input;
    	let input_value_value;
    	let t2;
    	let span1;
    	let t3;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[8](/*item*/ ctx[9]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			span0 = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			span1 = element("span");
    			t3 = space();
    			attr_dev(span0, "class", "uk-sortable-handle uk-margin-small-right uk-text-center");
    			attr_dev(span0, "uk-icon", "icon: table");
    			add_location(span0, file, 130, 10, 3396);
    			attr_dev(input, "type", "hidden");
    			attr_dev(input, "class", "ids");
    			input.value = input_value_value = /*item*/ ctx[9].id;
    			add_location(input, file, 131, 10, 3547);
    			attr_dev(span1, "uk-icon", "trash");
    			attr_dev(span1, "class", "uk-float-right uk-margin-small-top");
    			add_location(span1, file, 133, 10, 3610);
    			add_location(li, file, 129, 7, 3381);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, span0);
    			append_dev(li, t0);
    			append_dev(li, t1);
    			append_dev(li, input);
    			append_dev(li, t2);
    			append_dev(li, span1);
    			append_dev(li, t3);

    			if (!mounted) {
    				dispose = listen_dev(span1, "click", click_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*data*/ 1 && t0_value !== (t0_value = /*item*/ ctx[9].title.replace(/(<([^>]+)>)/gi, "") + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*data*/ 1 && input_value_value !== (input_value_value = /*item*/ ctx[9].id)) {
    				prop_dev(input, "value", input_value_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(129:6) {#each data.entries as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let style;
    	let t1;
    	let t2;
    	let br0;
    	let br1;
    	let t3;
    	let div1;
    	let div0;
    	let button0;
    	let t4;
    	let br2;
    	let t5;
    	let t6;
    	let div5;
    	let div4;
    	let button1;
    	let t7;
    	let div2;
    	let h4;
    	let t9;
    	let div3;
    	let ul;
    	let t10;
    	let button2;
    	let t12;
    	let deckgo_inline_editor;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*editing*/ ctx[1]) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);
    	let each_value_1 = /*data*/ ctx[0].layouts;
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*data*/ ctx[0].entries;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			style = element("style");
    			style.textContent = ".editing {\n   background-color: #FFF3CD;\n   transition: background-color .3s linear;\n}\n.editing.done {\n   background-color: transparent;\n}\n.editable:hover{\n  background-color: #FFF3CD;\n}";
    			t1 = space();
    			if_block.c();
    			t2 = space();
    			br0 = element("br");
    			br1 = element("br");
    			t3 = space();
    			div1 = element("div");
    			div0 = element("div");
    			button0 = element("button");
    			t4 = space();
    			br2 = element("br");
    			t5 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t6 = space();
    			div5 = element("div");
    			div4 = element("div");
    			button1 = element("button");
    			t7 = space();
    			div2 = element("div");
    			h4 = element("h4");
    			h4.textContent = "Manage Page";
    			t9 = space();
    			div3 = element("div");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t10 = space();
    			button2 = element("button");
    			button2.textContent = "Save";
    			t12 = space();
    			deckgo_inline_editor = element("deckgo-inline-editor");
    			add_location(style, file, 1, 0, 14);
    			add_location(br0, file, 96, 0, 2480);
    			add_location(br1, file, 96, 4, 2484);
    			attr_dev(button0, "class", "uk-offcanvas-close");
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "uk-close", "");
    			add_location(button0, file, 100, 8, 2566);
    			add_location(br2, file, 102, 0, 2635);
    			attr_dev(div0, "class", "uk-offcanvas-bar");
    			add_location(div0, file, 99, 4, 2527);
    			attr_dev(div1, "id", "add-item");
    			attr_dev(div1, "uk-offcanvas", "");
    			add_location(div1, file, 98, 0, 2490);
    			attr_dev(button1, "class", "uk-modal-close-default");
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "uk-close", "");
    			add_location(button1, file, 119, 6, 3065);
    			attr_dev(h4, "class", "uk-modal-title");
    			add_location(h4, file, 122, 4, 3174);
    			attr_dev(div2, "class", "uk-modal-header");
    			add_location(div2, file, 121, 2, 3140);
    			attr_dev(ul, "class", "uk-list uk-list-striped");
    			attr_dev(ul, "uk-sortable", "handle: .uk-sortable-handle");
    			add_location(ul, file, 127, 3, 3260);
    			attr_dev(button2, "class", "uk-button uk-button-primary uk-float-right");
    			add_location(button2, file, 140, 2, 3762);
    			attr_dev(div3, "class", "uk-modal-body");
    			add_location(div3, file, 125, 0, 3228);
    			attr_dev(div4, "class", "uk-modal-dialog");
    			add_location(div4, file, 118, 4, 3029);
    			attr_dev(div5, "id", "manage-items");
    			attr_dev(div5, "class", "uk-flex-top");
    			attr_dev(div5, "uk-modal", "");
    			add_location(div5, file, 117, 0, 2972);
    			set_custom_element_data(deckgo_inline_editor, "background-color", "false");
    			set_custom_element_data(deckgo_inline_editor, "align", "false");
    			add_location(deckgo_inline_editor, file, 147, 0, 3886);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document_1.head, style);
    			insert_dev(target, t1, anchor);
    			if_block.m(target, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, button0);
    			append_dev(div0, t4);
    			append_dev(div0, br2);
    			append_dev(div0, t5);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div0, null);
    			}

    			insert_dev(target, t6, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div4);
    			append_dev(div4, button1);
    			append_dev(div4, t7);
    			append_dev(div4, div2);
    			append_dev(div2, h4);
    			append_dev(div4, t9);
    			append_dev(div4, div3);
    			append_dev(div3, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			append_dev(div3, t10);
    			append_dev(div3, button2);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, deckgo_inline_editor, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button2, "click", /*saveOrder*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(t2.parentNode, t2);
    				}
    			}

    			if (dirty & /*addItem, data*/ 17) {
    				each_value_1 = /*data*/ ctx[0].layouts;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*deleteItem, data*/ 33) {
    				each_value = /*data*/ ctx[0].entries;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			detach_dev(style);
    			if (detaching) detach_dev(t1);
    			if_block.d(detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(div5);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(deckgo_inline_editor);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function clear() {
    	var r = confirm("Are you sure you want to start over?");

    	if (r == true) {
    		localStorage.removeItem("mydata");
    		location.reload();
    	}
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("InlineEditor", slots, []);
    	let { data } = $$props;
    	let editing = false;

    	function edit() {
    		document.querySelectorAll(".edit").forEach(function (e) {
    			console.log("ok");
    			e.contentEditable = true;
    			e.classList.add("editing");

    			window.setTimeout(
    				function () {
    					e.classList.add("done");
    				},
    				300
    			);
    		});

    		$$invalidate(1, editing = true);
    	}

    	function save() {
    		document.querySelectorAll(".edit").forEach(function (e) {
    			console.log("ok");
    			e.contentEditable = false;
    			e.classList.remove("editing");
    			e.classList.remove("done");
    		});

    		$$invalidate(1, editing = false);
    		localStorage.setItem("mydata", JSON.stringify(data));
    	}

    	function addItem(layout) {
    		let newItem = {
    			id: "item-" + Date.now(),
    			title: "Lorem ipsum",
    			content: "Lorem ipsum dolor site amet",
    			layout
    		};

    		data.entries.push(newItem);
    		$$invalidate(0, data);
    		UIkit.offcanvas("#add-item").hide();
    	}

    	function deleteItem(id) {
    		var r = confirm("Are you sure you want to delete this item?");

    		if (r == true) {
    			let curIndex = data.entries.findIndex(x => x.id == id);
    			data.entries.splice(curIndex, 1);
    			$$invalidate(0, data);
    			UIkit.modal("#manage-items").hide();
    		}
    	}

    	function saveOrder() {
    		var order = [];

    		document.querySelectorAll(".ids").forEach(function (e) {
    			order.push(e.value);
    		});

    		console.log(order);

    		$$invalidate(
    			0,
    			data.entries = data.entries.sort(function (a, b) {
    				return order.indexOf(a.id) - order.indexOf(b.id);
    			}),
    			data
    		);

    		console.log(data.entries);
    		UIkit.modal("#manage-items").hide();
    	}

    	const writable_props = ["data"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<InlineEditor> was created with unknown prop '${key}'`);
    	});

    	const click_handler = item => addItem(item);
    	const click_handler_1 = item => deleteItem(item.id);

    	$$self.$$set = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    	};

    	$$self.$capture_state = () => ({
    		data,
    		editing,
    		edit,
    		save,
    		clear,
    		addItem,
    		deleteItem,
    		saveOrder
    	});

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("editing" in $$props) $$invalidate(1, editing = $$props.editing);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		data,
    		editing,
    		edit,
    		save,
    		addItem,
    		deleteItem,
    		saveOrder,
    		click_handler,
    		click_handler_1
    	];
    }

    class InlineEditor extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { data: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "InlineEditor",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*data*/ ctx[0] === undefined && !("data" in props)) {
    			console_1.warn("<InlineEditor> was created without expected prop 'data'");
    		}
    	}

    	get data() {
    		throw new Error("<InlineEditor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<InlineEditor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.31.0 */

    const { console: console_1$1 } = globals;
    const file$1 = "src/App.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	child_ctx[11] = list;
    	child_ctx[12] = i;
    	return child_ctx;
    }

    // (48:1) {#if item.layout == 'two-col'}
    function create_if_block_1(ctx) {
    	let section;
    	let div4;
    	let div1;
    	let h20;
    	let t0;
    	let div0;
    	let t1;
    	let div3;
    	let h21;
    	let t2;
    	let div2;
    	let mounted;
    	let dispose;

    	function h20_input_handler() {
    		/*h20_input_handler*/ ctx[4].call(h20, /*each_value*/ ctx[11], /*item_index*/ ctx[12]);
    	}

    	function div0_input_handler_1() {
    		/*div0_input_handler_1*/ ctx[5].call(div0, /*each_value*/ ctx[11], /*item_index*/ ctx[12]);
    	}

    	function h21_input_handler() {
    		/*h21_input_handler*/ ctx[6].call(h21, /*each_value*/ ctx[11], /*item_index*/ ctx[12]);
    	}

    	function div2_input_handler() {
    		/*div2_input_handler*/ ctx[7].call(div2, /*each_value*/ ctx[11], /*item_index*/ ctx[12]);
    	}

    	const block = {
    		c: function create() {
    			section = element("section");
    			div4 = element("div");
    			div1 = element("div");
    			h20 = element("h2");
    			t0 = space();
    			div0 = element("div");
    			t1 = space();
    			div3 = element("div");
    			h21 = element("h2");
    			t2 = space();
    			div2 = element("div");
    			attr_dev(h20, "class", "edit");
    			attr_dev(h20, "contenteditable", "false");
    			if (/*item*/ ctx[10].title === void 0) add_render_callback(h20_input_handler);
    			add_location(h20, file$1, 51, 4, 1867);
    			attr_dev(div0, "class", "edit");
    			attr_dev(div0, "contenteditable", "false");
    			if (/*item*/ ctx[10].content === void 0) add_render_callback(div0_input_handler_1);
    			add_location(div0, file$1, 52, 4, 1946);
    			attr_dev(div1, "class", "uk-text-center");
    			add_location(div1, file$1, 50, 5, 1834);
    			attr_dev(h21, "class", "edit");
    			attr_dev(h21, "contenteditable", "false");
    			if (/*item*/ ctx[10].title === void 0) add_render_callback(h21_input_handler);
    			add_location(h21, file$1, 55, 4, 2073);
    			attr_dev(div2, "class", "edit");
    			attr_dev(div2, "contenteditable", "false");
    			if (/*item*/ ctx[10].content2 === void 0) add_render_callback(div2_input_handler);
    			add_location(div2, file$1, 56, 4, 2152);
    			attr_dev(div3, "class", "uk-text-center");
    			add_location(div3, file$1, 54, 5, 2040);
    			attr_dev(div4, "class", "uk-grid-divider uk-child-width-expand@s");
    			attr_dev(div4, "uk-grid", "");
    			add_location(div4, file$1, 49, 1, 1767);
    			add_location(section, file$1, 48, 1, 1756);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div4);
    			append_dev(div4, div1);
    			append_dev(div1, h20);

    			if (/*item*/ ctx[10].title !== void 0) {
    				h20.innerHTML = /*item*/ ctx[10].title;
    			}

    			append_dev(div1, t0);
    			append_dev(div1, div0);

    			if (/*item*/ ctx[10].content !== void 0) {
    				div0.innerHTML = /*item*/ ctx[10].content;
    			}

    			append_dev(div4, t1);
    			append_dev(div4, div3);
    			append_dev(div3, h21);

    			if (/*item*/ ctx[10].title !== void 0) {
    				h21.innerHTML = /*item*/ ctx[10].title;
    			}

    			append_dev(div3, t2);
    			append_dev(div3, div2);

    			if (/*item*/ ctx[10].content2 !== void 0) {
    				div2.innerHTML = /*item*/ ctx[10].content2;
    			}

    			if (!mounted) {
    				dispose = [
    					listen_dev(h20, "input", h20_input_handler),
    					listen_dev(div0, "input", div0_input_handler_1),
    					listen_dev(h21, "input", h21_input_handler),
    					listen_dev(div2, "input", div2_input_handler)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*data*/ 1 && /*item*/ ctx[10].title !== h20.innerHTML) {
    				h20.innerHTML = /*item*/ ctx[10].title;
    			}

    			if (dirty & /*data*/ 1 && /*item*/ ctx[10].content !== div0.innerHTML) {
    				div0.innerHTML = /*item*/ ctx[10].content;
    			}

    			if (dirty & /*data*/ 1 && /*item*/ ctx[10].title !== h21.innerHTML) {
    				h21.innerHTML = /*item*/ ctx[10].title;
    			}

    			if (dirty & /*data*/ 1 && /*item*/ ctx[10].content2 !== div2.innerHTML) {
    				div2.innerHTML = /*item*/ ctx[10].content2;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(48:1) {#if item.layout == 'two-col'}",
    		ctx
    	});

    	return block;
    }

    // (63:1) {#if item.layout == 'default'}
    function create_if_block$1(ctx) {
    	let section;
    	let h2;
    	let t0;
    	let div;
    	let t1;
    	let mounted;
    	let dispose;

    	function h2_input_handler() {
    		/*h2_input_handler*/ ctx[8].call(h2, /*each_value*/ ctx[11], /*item_index*/ ctx[12]);
    	}

    	function div_input_handler() {
    		/*div_input_handler*/ ctx[9].call(div, /*each_value*/ ctx[11], /*item_index*/ ctx[12]);
    	}

    	const block = {
    		c: function create() {
    			section = element("section");
    			h2 = element("h2");
    			t0 = space();
    			div = element("div");
    			t1 = space();
    			attr_dev(h2, "class", "edit");
    			attr_dev(h2, "contenteditable", "false");
    			if (/*item*/ ctx[10].title === void 0) add_render_callback(h2_input_handler);
    			add_location(h2, file$1, 65, 4, 2319);
    			attr_dev(div, "class", "edit");
    			attr_dev(div, "contenteditable", "false");
    			if (/*item*/ ctx[10].content === void 0) add_render_callback(div_input_handler);
    			add_location(div, file$1, 66, 4, 2398);
    			add_location(section, file$1, 63, 1, 2304);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, h2);

    			if (/*item*/ ctx[10].title !== void 0) {
    				h2.innerHTML = /*item*/ ctx[10].title;
    			}

    			append_dev(section, t0);
    			append_dev(section, div);

    			if (/*item*/ ctx[10].content !== void 0) {
    				div.innerHTML = /*item*/ ctx[10].content;
    			}

    			append_dev(section, t1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(h2, "input", h2_input_handler),
    					listen_dev(div, "input", div_input_handler)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*data*/ 1 && /*item*/ ctx[10].title !== h2.innerHTML) {
    				h2.innerHTML = /*item*/ ctx[10].title;
    			}

    			if (dirty & /*data*/ 1 && /*item*/ ctx[10].content !== div.innerHTML) {
    				div.innerHTML = /*item*/ ctx[10].content;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(63:1) {#if item.layout == 'default'}",
    		ctx
    	});

    	return block;
    }

    // (46:0) {#each data.entries as item}
    function create_each_block$1(ctx) {
    	let t;
    	let if_block1_anchor;
    	let if_block0 = /*item*/ ctx[10].layout == "two-col" && create_if_block_1(ctx);
    	let if_block1 = /*item*/ ctx[10].layout == "default" && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*item*/ ctx[10].layout == "two-col") {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					if_block0.m(t.parentNode, t);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*item*/ ctx[10].layout == "default") {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$1(ctx);
    					if_block1.c();
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(46:0) {#each data.entries as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div1;
    	let inlineeditor;
    	let updating_data;
    	let t0;
    	let section;
    	let div0;
    	let t1;
    	let current;
    	let mounted;
    	let dispose;

    	function inlineeditor_data_binding(value) {
    		/*inlineeditor_data_binding*/ ctx[2].call(null, value);
    	}

    	let inlineeditor_props = {};

    	if (/*data*/ ctx[0] !== void 0) {
    		inlineeditor_props.data = /*data*/ ctx[0];
    	}

    	inlineeditor = new InlineEditor({
    			props: inlineeditor_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(inlineeditor, "data", inlineeditor_data_binding));
    	let each_value = /*data*/ ctx[0].entries;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			create_component(inlineeditor.$$.fragment);
    			t0 = space();
    			section = element("section");
    			div0 = element("div");
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "edit");
    			attr_dev(div0, "contenteditable", "false");
    			if (/*data*/ ctx[0].intro === void 0) add_render_callback(() => /*div0_input_handler*/ ctx[3].call(div0));
    			add_location(div0, file$1, 42, 0, 1604);
    			add_location(section, file$1, 41, 0, 1594);
    			attr_dev(div1, "class", "uk-container uk-margin-top");
    			add_location(div1, file$1, 38, 0, 1525);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			mount_component(inlineeditor, div1, null);
    			append_dev(div1, t0);
    			append_dev(div1, section);
    			append_dev(section, div0);

    			if (/*data*/ ctx[0].intro !== void 0) {
    				div0.innerHTML = /*data*/ ctx[0].intro;
    			}

    			append_dev(div1, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div0, "input", /*div0_input_handler*/ ctx[3]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const inlineeditor_changes = {};

    			if (!updating_data && dirty & /*data*/ 1) {
    				updating_data = true;
    				inlineeditor_changes.data = /*data*/ ctx[0];
    				add_flush_callback(() => updating_data = false);
    			}

    			inlineeditor.$set(inlineeditor_changes);

    			if (dirty & /*data*/ 1 && /*data*/ ctx[0].intro !== div0.innerHTML) {
    				div0.innerHTML = /*data*/ ctx[0].intro;
    			}

    			if (dirty & /*data*/ 1) {
    				each_value = /*data*/ ctx[0].entries;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(inlineeditor.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(inlineeditor.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(inlineeditor);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let { name } = $$props;
    	let data = {};
    	data.intro = "<h1>Lorem Ipsum</h1><div>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris porta accumsan elit eget malesuada. Cras non congue risus, ac venenatis ipsum. Sed tempus consectetur nisi, ut gravida ex tincidunt id. Nulla tempus sed lorem vitae sodales. Nullam lacinia at nisi at hendrerit. Ut interdum consectetur orci at convallis. Fusce euismod, sapien consectetur tincidunt imperdiet, sem augue euismod nisi, eu aliquet elit libero eget tellus. Curabitur nec fringilla felis, eu tempus purus. In fermentum nisl eget quam vulputate tristique. Cras sodales nec urna sed laoreet. Curabitur eu sollicitudin ex. Integer ultricies facilisis lorem, id pellentesque orci sollicitudin vitae.</div>";

    	data.entries = [
    		{
    			id: "item-1",
    			title: "Lorem Ipsum",
    			content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    			title2: "Lorem Ipsum",
    			content2: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    			layout: "two-col"
    		},
    		{
    			id: "item-2",
    			title: "Lorem Lila",
    			content: "Lorem ipsum dolor site amet.",
    			title2: "Lorem Lila",
    			content2: "Lorem ipsum dolor site amet.",
    			layout: "two-col"
    		}
    	];

    	data.layouts = ["default", "two-col"];

    	onMount(async () => {
    		if (localStorage.getItem("mydata") !== null) {
    			$$invalidate(0, data = JSON.parse(localStorage.getItem("mydata")));
    			console.log(JSON.parse(localStorage.getItem("mydata")));
    		}
    	});

    	const writable_props = ["name"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function inlineeditor_data_binding(value) {
    		data = value;
    		$$invalidate(0, data);
    	}

    	function div0_input_handler() {
    		data.intro = this.innerHTML;
    		$$invalidate(0, data);
    	}

    	function h20_input_handler(each_value, item_index) {
    		each_value[item_index].title = this.innerHTML;
    		$$invalidate(0, data);
    	}

    	function div0_input_handler_1(each_value, item_index) {
    		each_value[item_index].content = this.innerHTML;
    		$$invalidate(0, data);
    	}

    	function h21_input_handler(each_value, item_index) {
    		each_value[item_index].title = this.innerHTML;
    		$$invalidate(0, data);
    	}

    	function div2_input_handler(each_value, item_index) {
    		each_value[item_index].content2 = this.innerHTML;
    		$$invalidate(0, data);
    	}

    	function h2_input_handler(each_value, item_index) {
    		each_value[item_index].title = this.innerHTML;
    		$$invalidate(0, data);
    	}

    	function div_input_handler(each_value, item_index) {
    		each_value[item_index].content = this.innerHTML;
    		$$invalidate(0, data);
    	}

    	$$self.$$set = $$props => {
    		if ("name" in $$props) $$invalidate(1, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({ onMount, InlineEditor, name, data });

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(1, name = $$props.name);
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		data,
    		name,
    		inlineeditor_data_binding,
    		div0_input_handler,
    		h20_input_handler,
    		div0_input_handler_1,
    		h21_input_handler,
    		div2_input_handler,
    		h2_input_handler,
    		div_input_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { name: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[1] === undefined && !("name" in props)) {
    			console_1$1.warn("<App> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
