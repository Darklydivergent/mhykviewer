$(document).ready(() => {
    var v = new Viewer('assets');
    var screen_height = Math.max( document.body.scrollHeight, document.body.offsetHeight, 
                               document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight );   
    $("#footer").css("top",screen_height - $("#footer").height() - 20);
});

class Viewer {
    constructor (basePath) {
        this.l2d = new L2D(basePath);

        this.canvas = $(".Canvas");
        this.selectCharacter = $(".selectCharacter");
        this.selectAnimation = $(".selectAnimation");

        let stringCharacter = "<option>Select</option>";
        for (let val in charData) {
            stringCharacter+= '<option value="' + charData[val] + '">' + val + '</option>';
        }
        this.selectCharacter.html(stringCharacter);
        this.selectCharacter.change((event) => {
            if (event.target.selectedIndex == 0) {
                return;
            }
            let name = event.target.value;
            this.l2d.load(name, this);
        });

        var ht = window.innerHeight * 0.9;
        var wt = (ht / 16.0) * 9.0;

        this.app = new PIXI.Application(wt, ht, { transparent: true });
        this.canvas.html(this.app.view);

        this.app.ticker.add((deltaTime) => {
            if (!this.model) {
                return;
            }

            this.model.update(deltaTime);
            this.model.masks.update(this.app.renderer);
        });
        window.onresize = (event) => {
            if (event === void 0) { event = null; }
            let height = window.innerHeight * 0.9;
            let width = (height / 16.0) * 9.0;
            this.app.view.style.width = width + "px";
            this.app.view.style.height = height + "px";
            this.app.renderer.resize(width, height);

            if (document.getElementById("darken") != null) {
                document.getElementById("darken").top = window.pageYOffset + "px";
                document.getElementById("selector").top = (window.pageYOffset + (window.innerHeight)) + "px" ;
            }

            if (this.model) {
                this.model.position = new PIXI.Point((width * 1), (height * 1));
                this.model.scale = new PIXI.Point((this.model.position.x * 2), (this.model.position.x * 2));
                this.model.masks.resize(this.app.view.width, this.app.view.height);
            }
            var screen_height = Math.max( document.body.scrollHeight, document.body.offsetHeight, 
                               document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight );   
            $("#footer").css("top",screen_height - $("#footer").height() - 20);
        };
        this.isClick = false;
        this.app.view.addEventListener('mousedown', (event) => {
            this.isClick = true;
        });
      /*  this.app.view.addEventListener('mousemove', (event) => {
            if (this.isClick) {
                this.isClick = false;
                if (this.model) {
                    this.model.inDrag = true;
                }
            }

            if (this.model) {
                let mouse_x = this.model.position.x - event.offsetX;
                let mouse_y = this.model.position.y - event.offsetY;
                this.model.pointerX = -mouse_x / this.app.view.height;
                this.model.pointerY = -mouse_y / this.app.view.width;
            }
        });
        this.app.view.addEventListener('mouseup', (event) => {
            if (!this.model) {
                return;
            }
//comment out until see if can add tap motions
           // if (this.isClick) {
             //   if (this.isHit('TouchHead', event.offsetX, event.offsetY)) {
             //       this.startAnimation("touch_head", "base");
              //  } else if (this.isHit('TouchSpecial', event.offsetX, event.offsetY)) {
               //     this.startAnimation("touch_special", "base");
               // } else {
               //     const bodyMotions = ["touch_body", "main_1", "main_2", "main_3"];
               //     let currentMotion = bodyMotions[Math.floor(Math.random()*bodyMotions.length)];
               //    this.startAnimation(currentMotion, "base");
               // }
           // }*/

            this.isClick = false;
            this.model.inDrag = false;
        });
    }

    changeCanvas (model) {
        this.app.stage.removeChildren();

        this.selectAnimation.empty();
        model.motions.forEach((value, key) => {
            if (key != "effect") {
                let btn = document.createElement("button");
                let label = document.createTextNode(key);
                btn.appendChild(label);
                btn.className = "selectbutton";
                btn.addEventListener("click", () => {
                    this.startAnimation(key, "base");
                });
                this.selectAnimation.append(btn);
            }
        });

        this.model = model;
        this.model.update = this.onUpdate; // HACK: use hacked update fn for drag support
        // console.log(this.model);
        this.model.animator.addLayer("base", LIVE2DCUBISMFRAMEWORK.BuiltinAnimationBlenders.OVERRIDE, 1);

        this.app.stage.addChild(this.model);
        this.app.stage.addChild(this.model.masks);

        window.onresize();
    }

    onUpdate (delta) {
        let deltaTime = 0.016 * delta;

        if (!this.animator.isPlaying) {
            let m = this.motions.get("idle_basic");
            this.animator.getLayer("base").play(m);
        }
        this._animator.updateAndEvaluate(deltaTime);

        if (this.inDrag) {
            this.addParameterValueById("ParamAngleX", this.pointerX * 30);
            this.addParameterValueById("ParamAngleY", -this.pointerY * 30);
            this.addParameterValueById("ParamBodyAngleX", this.pointerX * 10);
            this.addParameterValueById("ParamBodyAngleY", -this.pointerY * 10);
            this.addParameterValueById("ParamEyeBallX", this.pointerX);
            this.addParameterValueById("ParamEyeBallY", -this.pointerY);
        }

        if (this._physicsRig) {
            this._physicsRig.updateAndEvaluate(deltaTime);
        }

        this._coreModel.update();

        let sort = false;
        for (let m = 0; m < this._meshes.length; ++m) {
            this._meshes[m].alpha = this._coreModel.drawables.opacities[m];
            this._meshes[m].visible = Live2DCubismCore.Utils.hasIsVisibleBit(this._coreModel.drawables.dynamicFlags[m]);
            if (Live2DCubismCore.Utils.hasVertexPositionsDidChangeBit(this._coreModel.drawables.dynamicFlags[m])) {
                this._meshes[m].vertices = this._coreModel.drawables.vertexPositions[m];
                this._meshes[m].dirtyVertex = true;
            }
            if (Live2DCubismCore.Utils.hasRenderOrderDidChangeBit(this._coreModel.drawables.dynamicFlags[m])) {
                sort = true;
            }
        }

        if (sort) {
            this.children.sort((a, b) => {
                let aIndex = this._meshes.indexOf(a);
                let bIndex = this._meshes.indexOf(b);
                let aRenderOrder = this._coreModel.drawables.renderOrders[aIndex];
                let bRenderOrder = this._coreModel.drawables.renderOrders[bIndex];

                return aRenderOrder - bRenderOrder;
            });
        }

        this._coreModel.drawables.resetDynamicFlags();
    }

    startAnimation (motionId, layerId) {
        if (!this.model) {
            return;
        }

        let m = this.model.motions.get(motionId);
        if (!m) {
            return;
        }

        let l = this.model.animator.getLayer(layerId);
        if (!l) {
            return;
        }

        l.play(m);
    }

    isHit (id, posX, posY) {
        if (!this.model) {
            return false;
        }

        let m = this.model.getModelMeshById(id);
        if (!m) {
            return false;
        }

        const vertexOffset = 0;
        const vertexStep = 2;
        const vertices = m.vertices;

        let left = vertices[0];
        let right = vertices[0];
        let top = vertices[1];
        let bottom = vertices[1];

        for (let i = 1; i < 4; ++i) {
            let x = vertices[vertexOffset + i * vertexStep];
            let y = vertices[vertexOffset + i * vertexStep + 1];

            if (x < left) {
                left = x;
            }
            if (x > right) {
                right = x;
            }
            if (y < top) {
                top = y;
            }
            if (y > bottom) {
                bottom = y;
            }
        }

        let mouse_x = m.worldTransform.tx - posX;
        let mouse_y = m.worldTransform.ty - posY;
        let tx = -mouse_x / m.worldTransform.a;
        let ty = -mouse_y / m.worldTransform.d;

        return ((left <= tx) && (tx <= right) && (top <= ty) && (ty <= bottom));
    }
} 

function onSelectBG(){
    console.log(window.pageXOffset + " : " + window.pageYOffset);
    var div = document.createElement('div');
    div.className = "darken";
    div.id = "darken";
    div.style.top = window.pageYOffset + "px";
    div.addEventListener("click", function(e) {
            document.body.removeChild(document.getElementById("selector"));
            document.body.removeChild(document.getElementById("darken"));
            document.body.style.overflow = "auto";
        }, false);
    document.body.appendChild(div);
    document.body.style.overflow = "hidden";
    var selector = document.createElement('div');
    selector.id = "selector";
    selector.className = "selector";
    selector.style.top = (window.pageYOffset + (window.innerHeight * 0.05)) + "px" ;
    document.body.appendChild(selector);
    for (var i = 0; i < backgroundData.length; i++){
        var img = document.createElement('div');
        img.className = "thumbbutton";
        img.style.backgroundImage = "url(../assets/bg/"+backgroundData[i]+")";
        img.style.backgroundSize = "100%";
        img.id = backgroundData[i];
        img.addEventListener("click", function(e) {
            document.getElementById("L2dCanvas").style.backgroundImage = "url(../assets/bg/"+this.id+")";
            document.body.removeChild(document.getElementById("selector"));
            document.body.removeChild(document.getElementById("darken"));
            document.body.style.overflow = "auto";
        }, false);
        document.getElementById("selector").appendChild(img);
    }
}

