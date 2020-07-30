class ObserveClass{
	constructor(targetNode=document.body,config={subtree:true,childList:true}){
		this.observer = new MutationObserver(this.callback)
		this.persistentStack = [];
		this.popStack = [];
		this.observer.observe(targetNode,config);
	}

	destructor = ()=>this.observer.disconnect();

	addToPersistent = (predicate,callback,adding=1)=>this.persistentStack.push([predicate,callback,adding]);
	addToPop = (predicate,adding=1,id)=>new Promise(r=>this.popStack.push([predicate,r,adding,id]))
	addToPopWithTimeToLive = (time,predicate,adding)=>{
		const id = makeID();
		const promise = this.addToPop(predicate,adding,id);
		const timeout = setTimeout(()=>this.popStack = this.popStack.filter(e=>e[3] !== id),time);
		return new Promise(async r=>{
			const elem = await promise;
			clearTimeout(timeout);
			r(elem);
		})
	}

	callback = (mutationList,observer)=>{
		for(let mutation of mutationList){
			let i = 0;
			const addNode = Array.from(mutation.addedNodes);
			const removeNode = Array.from(mutation.removedNodes);

			const resolvePredicate = predicateFunc => (predicateFunc)?((typeof predicateFunc==='string')?(elem)=>elem.querySelector(predicateFunc):predicateFunc):()=>true;

			while(i<this.popStack.length){
				const [predicateFunc,resolve,adding] = this.popStack[i];
				let complete = false;
				const predicate = resolvePredicate(predicateFunc);
		
				const checkListOfNode = (list)=>{
					for(let node of list) if(predicate(node)){
						resolve(node);
						complete = true;
						return this.popStack.splice(i,1);
					}
				}
	
				if(adding) checkListOfNode(addNode);
				else checkListOfNode(removeNode);
				if(!complete) i++;
			}
	
			for(let [predicateFunc,r,adding] of this.persistentStack){
				const predicate = resolvePredicate(predicateFunc);
				const checkListOfNode = (list)=>{
					for(let node of list) if(predicate(node)){
						r(node);
					}
				}
				if(adding) checkListOfNode(addNode);
				else checkListOfNode(removeNode);
			}
		}
	}
}

 Element.prototype.waitFor = function(query){
	const observer = new ObserveClass(this);
	const promise = new Promise(r=>{
		observer.addToPop(query,(el)=>{
			observer.disconnect();
			r(el);
		})
	})
	return promise;
}

Element.prototype.clickPromise = function(){
	return new Promise(r=>{
		const done = (e)=>{
			this.removeEventListener('click',done);
			r(e);
		}
		this.addEventListener('click',done);
	})
}

Element.prototype.runQuery = function(query){
	return this.querySelector(query) || null;
}

Element.prototype.runQueryAll = function(query){
	return Array.from(this.querySelectorAll(query));
}

const blockIconHTML = '<svg style="transform:rotate(90deg)" viewBox="0 0 24 24" width="16" height="16" class="r-1re7ezh r-4qtqp9 r-yyyyoo r-1q142lx r-1xvli5t r-1rq6c10 r-dnmrzs r-bnwqim r-1plcrui r-lrvibr"><g><path d="M12 1.25C6.072 1.25 1.25 6.072 1.25 12S6.072 22.75 12 22.75 22.75 17.928 22.75 12 17.928 1.25 12 1.25zm0 1.5c2.28 0 4.368.834 5.982 2.207L4.957 17.982C3.584 16.368 2.75 14.282 2.75 12c0-5.1 4.15-9.25 9.25-9.25zm0 18.5c-2.28 0-4.368-.834-5.982-2.207L19.043 6.018c1.373 1.614 2.207 3.7 2.207 5.982 0 5.1-4.15 9.25-9.25 9.25z"></path></g></svg>';
const threadIconHTML = '<svg width="15" class="r-1re7ezh r-4qtqp9 r-yyyyoo r-1q142lx r-1xvli5t r-1rq6c10 r-dnmrzs r-bnwqim r-1plcrui r-lrvibr" viewBox="0 0 96.858 70.805">  <path d="M 87.507 52.104 L 83.831 52.104 L 83.831 27.714 L 70.805 14.688 L 70.805 0 L 61.455 0 C 56.981 0 53.232 3.159 52.319 7.364 C 51.133 6.819 49.816 6.513 48.429 6.513 C 45.898 6.513 43.601 7.525 41.916 9.164 C 40.23 7.525 37.933 6.513 35.403 6.513 C 32.872 6.513 30.575 7.525 28.89 9.164 C 27.204 7.525 24.907 6.513 22.377 6.513 C 20.989 6.513 19.672 6.819 18.487 7.364 C 17.573 3.159 13.825 0 9.351 0 L 0 0 L 0 70.805 L 9.351 70.805 C 13.825 70.805 17.573 67.646 18.487 63.441 C 19.672 63.986 20.989 64.292 22.377 64.292 C 24.907 64.292 27.205 63.28 28.89 61.642 C 30.575 63.28 32.872 64.292 35.403 64.292 C 37.933 64.292 40.231 63.28 41.916 61.642 C 43.601 63.28 45.898 64.292 48.429 64.292 C 49.817 64.292 51.133 63.986 52.319 63.441 C 53.232 67.645 56.981 70.805 61.455 70.805 L 70.806 70.805 L 70.806 56.117 L 78.156 48.766 L 78.156 70.805 L 87.507 70.805 C 92.663 70.805 96.858 66.61 96.858 61.454 C 96.858 56.298 92.662 52.104 87.507 52.104 Z M 13.026 61.454 C 13.026 63.481 11.378 65.13 9.351 65.13 L 5.676 65.13 L 5.676 5.675 L 9.351 5.675 C 11.378 5.675 13.026 7.324 13.026 9.351 L 13.026 15.864 L 13.026 54.942 Z M 22.377 58.617 C 20.35 58.617 18.701 56.968 18.701 54.941 L 18.701 15.864 C 18.701 13.837 20.35 12.188 22.377 12.188 C 24.404 12.188 26.052 13.837 26.052 15.864 L 26.052 54.941 C 26.052 56.968 24.404 58.617 22.377 58.617 Z M 35.403 58.617 C 33.376 58.617 31.727 56.968 31.727 54.941 L 31.727 15.864 C 31.727 13.837 33.376 12.188 35.403 12.188 C 37.429 12.188 39.078 13.837 39.078 15.864 L 39.078 54.941 C 39.078 56.968 37.429 58.617 35.403 58.617 Z M 48.429 58.617 C 46.402 58.617 44.753 56.968 44.753 54.941 L 44.753 15.864 C 44.753 13.837 46.402 12.188 48.429 12.188 C 50.455 12.188 52.104 13.837 52.104 15.864 L 52.104 54.941 C 52.104 56.968 50.455 58.617 48.429 58.617 Z M 65.13 65.13 L 61.455 65.13 C 59.428 65.13 57.779 63.481 57.779 61.454 L 57.779 54.941 L 57.779 15.864 L 57.779 9.351 C 57.779 7.324 59.428 5.675 61.455 5.675 L 65.13 5.675 Z M 70.805 48.091 L 70.805 22.714 L 78.156 30.065 L 78.156 40.74 Z M 87.507 65.13 L 83.831 65.13 L 83.831 57.779 L 87.507 57.779 C 89.533 57.779 91.182 59.428 91.182 61.455 C 91.182 63.481 89.533 65.13 87.507 65.13 Z" style=""/></svg>';

const makeID = ()=>Math.random().toString();

class AddBlockButton{
	constructor(elem,func){
		this.elem = elem;
		if(this.elem.querySelectorAll("div.extensionicon").length) return;
		const blockObject = this.addObject(func,blockIconHTML,3,[224,36,94]);
	}

	addObject = (callback,iconHTML,order = 3,[c1,c2,c3])=>{
		const icon = this.elem.querySelector(`div[role="group"] div:nth-child(${order})`);
		icon.after(icon.cloneNode(true));
		icon.className = icon.previousSibling.className;
		const myObject = icon.nextSibling;
		myObject.classList.add("extensionicon")
		const color = document.body.style.backgroundColor;
		const iconColor = (color=='rgb(0, 0, 0)') ? 'rgb(110, 118, 125)' : ((color === 'rgb(16, 23, 30)' || color === 'rgb(21, 32, 43)') ? 'rgb(136, 153, 166)' : 'rgb(101, 119, 134)');
		const block = document.createElement('div');
		block.style ='transition-duration: 0.2s;transition-property: background-color, box-shadow;color:'+iconColor+' ;fill: currentColor;top: 0px; right: 0px; left: 0px; bottom: 0px; display: inline-flex; position: absolute; margin-bottom: -8px ; margin-left: -8px; margin-right: -8px; margin-top: -8px; border-bottom-left-radius: 9999px; border-bottom-right-radius: 9999px; border-top-left-radius: 9999px; border-top-right-radius: 9999px;';
		block.classList.add('extensioniconblock');

		const secondDiv = myObject.querySelector('svg').parentNode;
		secondDiv.innerHTML = iconHTML;
		secondDiv.prepend(block);
		secondDiv.style.color = iconColor;
		secondDiv.style.fill = "currentColor";
		const svg = secondDiv.querySelector('svg');

		const transformBack = ()=>{
			block.style.backgroundColor = "rgba(0, 0, 0, 0)";
			block.style.transitionProperty = "none";
			svg.style.color = iconColor;
		}
		secondDiv.addEventListener('mouseenter',()=>{
			block.style.backgroundColor = `rgba(${c1}, ${c2}, ${c3}, 0.1)`;
			block.style.transitionProperty = "background-color, box-shadow";
			svg.style.color = `rgba(${c1}, ${c2}, ${c3})`;
		})
		secondDiv.addEventListener("mouseleave",transformBack);
		
		try{
			myObject.querySelector('div:first-child').querySelector('div:nth-child(2)').style.display = 'none';
		}catch(e){
			console.log(e);
		}
		secondDiv.addEventListener('click',callback);
		return myObject;
	}

	doAction = (spanName)=>{
		this.moreElement.click();
		const menu = document.querySelector("div[role='menu']");
		menu.style.display = 'none';
		menu.style.visibility = 'hidden';
		const spans = Array.from(menu.querySelectorAll('span'));
		const span = spans.find(({innerHTML})=>innerHTML.match(spanName));
		span.click();
	}

	block = () =>{
		this.doAction(/Block/);
		const dialog = document.querySelector('div[role="alertdialog"]');
		dialog.style.display = 'none';
		dialog.style.visibility = 'hidden';
		const spans = Array.from(dialog.querySelectorAll('span'));
		const blockSpan = spans.find(span=>span.innerHTML === 'Block');
		blockSpan.click();
	}

}

let running = false;

const windowObserver = new ObserveClass(document.body);
const getRootElement = ()=>document.body.runQuery('div[aria-label*="Timeline"]') || windowObserver.addToPop("div[aria-label*='Timeline']")
const getElement = (query)=>document.body.runQuery(query) || windowObserver.addToPop(query);

Element.prototype.waitByObserver = async function(query){
	const observeClass = new ObserveClass(this);
	const elem = await observeClass.addToPop(query);
	observeClass.destructor();
	return elem;
}

Element.prototype.waitForAnElement = async function(query){
	if(this.runQuery(query)) return this.runQuery(query);
	return await this.waitByObserver(query);
}

const awaitForRoot = (func)=>async ()=>{
	const rootElement = await getRootElement();
	const rootObserver = new ObserveClass(rootElement);
	const result = await func(rootElement,rootObserver);
	rootObserver.destructor();
	return result
}

var _listeners = [];

EventTarget.prototype.addEventListenerBase = EventTarget.prototype.addEventListener;
EventTarget.prototype.addEventListener = function(type, listener)
{
    _listeners.push({target: this, type: type, listener: listener});
    if(type==='blur')console.log(type);
    this.addEventListenerBase(type, listener);
};

let totalBlocked = 0;

class Run{
	constructor(){
		console.log('construct');
		this.run();
	}

	run = async ()=>{
		this.rootElement = await getRootElement();
		this.rootObserver = new ObserveClass(this.rootElement);
		this.rootElement.runQueryAll('article').forEach(this.inject)
		this.rootObserver.addToPersistent('article',(elem)=>this.inject(elem))
	}

	dissectModal = async (div)=>{
		const content = div.children[0].children[0].children[0];
		const profile = content.children[0];
		profile.click()
	}

	resolveModal = async (modal)=>{
		const timeline = await modal.waitForAnElement('div[aria-label*="Timeline"]')
		const personlist = timeline.children[0].children[0];
		if(!personlist.children.length) return true;
		const person = personlist.runQuery("div[role='button']").parentNode.parentNode;
		await this.dissectModal(person);
	}

	blockMain = elem=>{
		const moreElem = elem.runQuery('div[aria-label="More"]')
		moreElem.click();
		const menu = document.body.runQuery("div[role='menu']")
		const spans = menu.runQueryAll('span').find(e=>e.innerHTML.match(/Block/))
		spans.click();
		const dialog = document.body.querySelector('div[role="alertdialog"]');
		const spansa = Array.from(dialog.querySelectorAll('span'));
		const blockSpan = spansa.find(span=>span.innerHTML === 'Block');
		blockSpan.click();
	}

	block = awaitForRoot(async (rootElement,rootObserver)=>{
		const more = await document.body.waitForAnElement("div[aria-label='More']")
		more.click();
		const menu = await document.body.waitForAnElement("div[role='menu']");
		const items = menu.runQueryAll('div[role="menuitem"]');
		// await Promise.allSettled(items.map(e=>(e.waitForAnElement('span'))));
		const specific = items.find(item=>item.runQueryAll('span').filter(e=>!e.children.length&&e.innerHTML).find(e=>e.innerHTML.match(/Block @/)));
		specific.click();
		const dialog = document.querySelector('div[role="alertdialog"]');
		const spans = Array.from(dialog.querySelectorAll('span'));
		const blockSpan = spans.find(span=>span.innerHTML === 'Block');
		blockSpan.click();
	})

	beginNuke =  (rightA)=>new Promise(r=>{
		rightA.click();
		this.layerObserver = new ObserveClass(getElement('div[id="layers"]'))

		const findLambda = (e)=>{
			return e.runQueryAll('span').find(e=>e.innerHTML.match(/No items/))
		}
		let finished = false
		const done = async ()=>{
			history.back();
			await (new Promise(r=>setTimeout(r,1000)));
			return await this.getArticle();
		}
		const notDone = async (e)=>{
			await this.resolveModal(e);
			await this.block()
			history.back();
			history.back();
			await (new Promise(r=>setTimeout(r,1000)));
			await this.getArticle();
			await this.recursiveNuke();
		}
		
		const modal = this.layerObserver.addToPop('div[aria-label*="Timeline"]');
		const wrapper = (func)=>async (...args)=>{
			if(finished) return;
			finished = true;
			const result = await func(...args);
			r(result);
		}
		const doneWrapped = wrapper(done);
		const notDoneWrapped = wrapper(notDone);
		if(findLambda(document.body)) doneWrapped();
		modal.then(notDoneWrapped)
		windowObserver.addToPop(findLambda).then(doneWrapped)
	})

	nukeBridge = async (elem,changeState,r)=>{
		const rightA = elem.runQueryAll('a').find(e=>e.href.match(/likes/))
		if(!rightA) return;
		const allSpans = rightA.runQueryAll('span').filter(e=>!e.children.length && e.innerHTML);
		if(!allSpans.find(e=>e.innerHTML === 'Likes')) return;
		changeState();
		const result = await this.beginNuke(rightA);
		r(result)
	}

	recursiveNuke = awaitForRoot((rootElement,rootObserver)=>new Promise(r=>{
		let found = false;
		const lambda = (e)=>found||this.nukeBridge(e,()=>found = true,(result)=>{
			r(result);
		})
		rootElement.runQueryAll('article').forEach(lambda)
		rootObserver.addToPersistent('article',lambda)
	}))

	getArticle = awaitForRoot((rootElement,rootObserver)=>new Promise(r=>{
		const lambda = (elem)=>{
			const rightA = elem.runQueryAll('a').find(e=>e.href.match(/likes/))
			if(!rightA) return;
			const allSpans = rightA.runQueryAll('span').filter(e=>!e.children.length && e.innerHTML);
			if(!allSpans.find(e=>e.innerHTML === 'Likes')) return;
			r(elem);
		}
		rootElement.runQueryAll('article').forEach(lambda)
		rootObserver.addToPersistent('article',lambda)
	}))

	inject = async (elem)=>{
		if(this.found) return;
		const rightA = elem.runQueryAll('a').find(e=>e.href.match(/likes/))
		if(!rightA) return;
		const allSpans = rightA.runQueryAll('span').filter(e=>!e.children.length && e.innerHTML);
		if(!allSpans.find(e=>e.innerHTML === 'Likes')) return;
		this.found = true;
		new AddBlockButton(elem,async ()=>{
			const sure = confirm("Are you sure you want to nuke this tweet?");
			if(!sure) return;
			running = true;
			const getFocus=()=>{
				document.focus()
			};
			document.addEventListener('blur',getFocus)
			await this.beginNuke(rightA)
			await this.blockMain(await this.getArticle());
			running = false;
			alert("Done!")
		})
		
	}

	destructor(){
		this.rootObserver.destructor();
	}
}
	
class URLObserver{
	constructor(){
		this.cacheLocation = this.location;
		this.processURL();
		const observer = new MutationObserver(this.testURL);
		observer.observe(document.body,{childList:true,subtree:true})
	}

	testURL = ()=>{
		if(this.cacheLocation !== this.location){
			this.cacheLocation = this.location;
			this.changeState();
			this.processURL();
		}
	}

	changeState = ()=>{
		if(this.stateObject) this.stateObject.destructor();
	}

	receiveInterfaceFactory = context => (username,userhandle,statuslink,avatarLink,followorunfollow) => {
		this.storageUnit.receive([username,userhandle,statuslink,avatarLink,context,followorunfollow]);
	}

	processURL = ()=>{
		const location = this.location;
		if(this.running) this.running.destructor();
		if(location.match(/status/) && !location.match(/likes/) && !running) return this.running = new Run();
	}

	get location(){
		return location.pathname;
	}
}

new URLObserver;
console.log=()=>{};