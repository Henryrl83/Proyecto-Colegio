/*
Class:
    df.WebFileUploadForm
Extends:
    df.WebBaseFileUpload

This class renders a form that represents a single file. It displays the file name and some of its 
details (mime type, size). The prompt button opens a the file selection dialog allowing the user to 
upload a new file. While the file is uploaded the form changes into a progress bar. The 
implementation of the file upload is inherited from the WebBaseFileUpload class.
    
Revision:
    2013/09/10  (HW, DAW)
        Initial version.
*/


df.ciUploadStateEmpty = 0;
df.ciUploadStateDisplay = 1;
df.ciUploadStateSelected = 2;
df.ciUploadStateUploading = 3;
df.ciUploadStateFinished = 4;

df.WebFileUploadForm = function WebFileUploadForm(sName, oParent){
    df.WebFileUploadForm.base.constructor.call(this, sName, oParent);
    
    this.prop(df.tInt, "peState", df.ciUploadStateEmpty);
    
    this.prop(df.tBool, "pbShowMime", false);
    
    this.prop(df.tString, "psFileName", "");
    this.prop(df.tInt, "piFileSize", 0);
    this.prop(df.tString, "psFileMime", "");
    
    
    this.event("OnFileClick", df.cCallModeWait);
    
    //  Configure super
    this.addSync("peState");
    this._sControlClass = "WebFileFrm";
};
df.defineClass("df.WebFileUploadForm", "df.WebBaseFileUpload", {

openHtml : function(aHtml){
    df.WebFileUploadForm.base.openHtml.call(this, aHtml);
    
    aHtml.push('<div class="WebFrm_Wrapper" tabindex="0"><div><div class="WebFile_Btn">');
    
    this.fileHtml(aHtml);

    aHtml.push('</div><div class="WebFile_Content"></div></div></div>');    
},

afterRender : function(){
    this._eControl = this._eWrap = df.dom.query(this._eElem, "div.WebFrm_Wrapper");
    this._eContent = df.dom.query(this._eElem, "div.WebFile_Content");
    this._ePrompt = df.dom.query(this._eElem, "div.WebFile_Btn");
    
    df.WebFileUploadForm.base.afterRender.call(this);
    
    df.dom.on("click", this._eContent, this.onContentClick, this);
    df.dom.on("click", this._ePrompt, this.onPromptClick, this);
    df.events.addDomKeyListener(this._eControl, this.onKey, this);
    
    this.updateDetails();
},

onPromptClick : function(oEvent){
    if(this.isEnabled()){
        this.selectFiles();
    }
},

/*
This method augments the onKey event handler to add support for the prompt key. 

@param  oEvent  Event object.
*/
onKey : function(oEvent){
    if(oEvent.matchKey(df.settings.formKeys.prompt)){ 
        if(this.isEnabled()){      // F4:  lookup
            this.selectFiles();
            oEvent.stop();
        }
    }else if(oEvent.matchKey(df.settings.tabKeys.enter)){
        if(this.fireContentClick()){      // Enter
            oEvent.stop();
        }
    }
},

fireContentClick : function(){
    if(this.isEnabled()){
        if(this.peState === df.ciUploadStateFinished || this.peState === df.ciUploadStateDisplay){
            this.fire("OnFileClick");
            return true;
        }
    }
    return false;
},

/*
@client-action
*/
updateDetails : function(){
    var sDtl;
    
    if(this._eWrap){
        if(this.psFileName){
            if(this.peState === df.ciUploadStateSelected){
                df.dom.addClass(this._eWrap, "WebFile_Pending");
            }else{
                df.dom.addClass(this._eWrap, "WebFile_HasFile");   
            }
            
            //sDtl = "Name: " + this.psFileName + " Size: " + this.piFileSize + " Mime: " + this.psFileMime;
            sDtl = this.psFileName;
            
            if(this.pbShowMime && this.piFileSize > 0 && this.psFileMime){
                sDtl += " (Size: " + df.sys.data.markupDataSize(this.piFileSize) + ", Mime: " + this.psFileMime + ")";
            }else if(this.piFileSize > 0){
                sDtl += " (" + df.sys.data.markupDataSize(this.piFileSize) + ")";
            }
            // sDtl = "Name: " + this.psFileName + " Size: " + this.piFileSize + " Mime: " + this.psFileMime;
            // sDtl = "Name: " + this.psFileName + " Size: " + this.piFileSize + " Mime: " + this.psFileMime;
        }else{
            df.dom.removeClass(this._eWrap, "WebFile_HasFile");
            df.dom.removeClass(this._eWrap, "WebFile_Pending");
            sDtl =  this.getWebApp().getTrans("no_file_selected");
        }
        
        df.dom.toggleClass(this._eContent, "WebFile_OnClick", (this.pbServerOnFileClick && (this.peState === df.ciUploadStateFinished || this.peState === df.ciUploadStateDisplay)));
        
        this._eContent.innerHTML = '<div class="WebFile_Details">' + sDtl + '</div>';
    }
},

displaySelectedFileDetails : function(){
    var oFile;
    
    if(this._aFiles.length > 0){
        oFile = this._aFiles[0].oFile;
        
        //  Mark properties as synchronized
        this.addSync("psFileName");
        this.addSync("piFileSize");
        this.addSync("psFileMime");
        
         //  Remember the file we where displaying
         this._eState = this.peState;
        if(this.peState === df.ciUploadDisplay){
            this._sDisplayFileName = this.psFileName;
            this._iDisplayFileSize = this.piFileSize;
            this._sDisplayFileMime = this.psFileMime;
        }
        
         //  Store new details
        this.peState = df.ciUploadStateSelected;
        this.psFileName = oFile.name;
        this.piFileSize = oFile.size;
        this.psFileMime = oFile.type;
    }
    
    //  Update display
    this.updateDetails();

},

displayStartWorking : function(){
    if(!this.pbShowDialog){
        this._eContent.innerHTML = '<div class="WebFile_Working"></div>';
    }else{
        df.WebFileUploadForm.base.displayStartWorking.call(this);
    }
},

displayProgress : function(iFile, iFiles, iFileLoaded, iFileTotal, iTotalLoaded, iTotal){
    var iPercent;
    
    if(!this.pbShowDialog){
        iPercent = (iTotalLoaded / iTotal) * 100;
        
        if(!this._eBar){
            //  Prepare progress bar
            this._eContent.innerHTML = '<div class="WebFile_Progress"><div class="WebFile_ProgressBar" style="width: 0%;"></div><div class="WebFile_ProgressLabel">0%</div></div>';
            this._eBar = df.dom.query(this._eContent, "div.WebFile_ProgressBar");
            this._eLbl = df.dom.query(this._eContent, "div.WebFile_ProgressLabel");
        }
        
        this._eBar.style.width = (Math.round(iPercent * 10) / 10) + "%";
        
        df.dom.setText(this._eLbl, Math.round(iPercent) + "%");
    }else{
        df.WebFileUploadForm.base.displayProgress.call(this, iFile, iFiles, iFileLoaded, iFileTotal, iTotalLoaded, iTotal);
    }
},

displayFinishWorking : function(){
    if(!this.pbShowDialog){
        if(this._eBar){
            this._eBar.style.width = "100%";
        }
    }else{
        df.WebFileUploadForm.base.displayFinishWorking.call(this);
    }
},

displayFinished : function(bSuccess){
    this._eBar = null;
    this._eLbl = null;
    
    this.peState = (bSuccess ? df.ciUploadStateFinished : df.ciUploadStateSelected);
    this.updateDetails();
    
    df.WebFileUploadForm.base.displayFinished.call(this, bSuccess);
},

onContentClick : function(oEvent){
    this.fireContentClick();
},

/* 
Augments applyEnabled to set the disabled and tabindex attributes of the control element.

@param  bVal    The enabled state.
*/
applyEnabled : function(bVal){
    df.WebFileUploadForm.base.applyEnabled.call(this, bVal);
    
    if(this._eControl){
        df.dom.setTabIndex(this._eControl, (bVal ? 0 : -1));
    }
}


});