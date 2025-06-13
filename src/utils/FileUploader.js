import axios from 'axios';
import {getFileExtension, getQueryParams } from './helpers';
import store from '../redux/store';

function FileUploader({
    file, 
    userInfoId, 
    fileContext, 
    userAccessToken, 
    mediaName,
    boardId,
    pageId ,
    resourceId ,
    resourceType,
    rowId,
    tableId, 
    scope,
    source ,
    uID
}) {

    const state = store.getState();
    let allFileTypes = state.global.fileTypes
    const app = window.sdkConfig.api_url;
    this.baseUrl = app;
    this.CHUNK_SIZE = 2048 * 2048;
    this.CHUNK_SIZE_INITIAL = 1024 * 1024;
    this.allowedFileTypes = allFileTypes.attachment
    this.filetypes = {
        "audio": allFileTypes.audio,
        "video": allFileTypes.video,
        "image": allFileTypes.image
    };

    this.file = file;
    this.fileContext = fileContext;
    this.userInfoId = userInfoId;
    this.accessToken = userAccessToken;
    this.onProgress = null;
    this.onSuccess = null;
    this.onError = null;
    this.currentChunk = 0;
    this.fileInfo = {};
    this.result = {};
    this.blobUrl="";
    this.fileDuration='';
    this.mediaName= mediaName;
    this.boardId=boardId;
    this.pageId=pageId;
    this._v2= false;
    this.uploadedChunks=null;
    this.successChunks=0;
    this.source = source;
    this.uID = uID;
    

    this.getDataURL = function(src) {
        let thecanvas = document.createElement("canvas");
        if (src.tagName == "IMG"){
            // thecanvas.width = 200;
            // thecanvas.height = 200;
            // let context = thecanvas.getContext('2d');
            // context.drawImage(src, 0, 0, thecanvas.width, thecanvas.height);
            // const dataURL = thecanvas.toDataURL();
            // return dataURL;
            const max = 600;
            let dataUrl, context = thecanvas.getContext('2d');
            if (src?.width > max) {
                thecanvas.width = src?.width;
                thecanvas.height = src?.height;
                context.drawImage(src, 0, 0);
                if( src?.width > src?.height) {
                    thecanvas.height = (src?.height / src?.width) * max;
                    thecanvas.width = max;
                } else {
                    thecanvas.width = (src?.width / src?.height) * max;
                    thecanvas.height = max;
                }
                context.drawImage(thecanvas, 0, 0, thecanvas.width, thecanvas.height);
                context.drawImage(src, 0, 0, thecanvas.width, thecanvas.height);
                dataUrl = thecanvas.toDataURL();
            } else {
                thecanvas.width = src?.width;
                thecanvas.height = src?.height;
                context.drawImage(thecanvas, 0, 0, thecanvas.width, thecanvas.height);
                context.drawImage(src, 0, 0, thecanvas.width, thecanvas.height);
                dataUrl = thecanvas.toDataURL();
            }
            return dataUrl
        } else if(src.tagName == "VIDEO") {
            src.width = src.tagName == "IMG" ? src.width : src.videoWidth;
            src.height = src.tagName == "IMG" ? src.height : src.videoHeight;
            if (src.width >= src.height) {
                thecanvas.width = 660;
                thecanvas.height = src.height / src.width * 660;
            } else {
                thecanvas.height = 660;
                thecanvas.width = src.width / src.height * 660;
            }
            if (src.width < 660 && src.height < 660) {
                thecanvas.height = src.height;
                thecanvas.width = src.width;
            }
        } else {
            thecanvas.height = 280;
            thecanvas.width = 420;
        }
        let context = thecanvas.getContext('2d');
        context.drawImage(src, 0, 0, thecanvas.width, thecanvas.height);
        if (src.tagName == "VIDEO") {
            const sWidth = thecanvas.width;
            const sHeight = thecanvas.height;
            context.beginPath();
            context.arc((sWidth / 2), (sHeight / 2), 20, 0, 2 * Math.PI, false);
            context.fillStyle = 'black';
            context.fill();
            context.beginPath();
            context.arc((sWidth / 2), (sHeight / 2), 19, 0, 2 * Math.PI, false);
            context.fillStyle = 'white';
            context.fill();
            let path = new Path2D();
            path.moveTo((sWidth / 2) + 10, sHeight / 2);
            path.lineTo((sWidth / 2) - 5, (sHeight / 2) - 10);
            path.lineTo((sWidth / 2) - 5, (sHeight / 2) + 10);
            context.fillStyle = 'black';
            context.fill(path);
        }
        const dataURL = thecanvas.toDataURL();
        return dataURL;
    }

    this.dataURLtoFile = function(dataurl, filename) {
        const arr = dataurl.split(',')
        const mime = arr[0].match(/:(.*?);/)[1]
        const bstr = atob(arr[1])
        let n = bstr.length
        const u8arr = new Uint8Array(n)
        while (n) {
            u8arr[n - 1] = bstr.charCodeAt(n - 1)
            n -= 1 // to make eslint happy
        }
        return new File([u8arr], filename, { type: mime })
    }

    this._uploadFile = function () {
        const _self = this;
        let formData = new FormData();
        formData.append('file', this.file);
        formData.append('fileExtension', this.fileInfo.fileType);
        formData.append('fileType', this.fileInfo.type);
        formData.append('filename', this.fileInfo.fileName);
        formData.append('fileContext', this.fileContext);
        if(resourceId)formData.append("resourceId" ,resourceId)
        if(resourceType)formData.append("resourceType" ,resourceType)
        if(rowId)formData.append("rowId" ,rowId);
        if(tableId)formData.append("tableId" ,tableId);
        if(scope)formData.append("scope" ,scope);

        if(this.pageId ){
            formData.append('pageId',this.pageId);
        }
        if(this.boardId){
            formData.append('boardId',this.boardId);
        }
        if(this.fileInfo?.height){
            formData.append('height',this.fileInfo?.height);
        }
        if(this.fileInfo?.width){
            formData.append('width',this.fileInfo?.width);
        }
        if (this.fileInfo.isThumbnail) {
            formData.append('thumbnailUpload', true);
            const thumbnail = _self.dataURLtoFile(this.fileInfo.thumbnailData, this.fileInfo.name + '_thumb');
            formData.append('thumbnail', thumbnail);
        } else {
            formData.append('thumbnailUpload', false);
        }
        
        if(_self.fileContext === "store"){
            axios.post(this.baseUrl + "/ka/users/" + this.userInfoId + "/store/file", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': "bearer " + this.accessToken
                },
                cancelToken : this.source?.token,
                onUploadProgress: function(e) {
                    if (_self.onProgress) {
                        const progress = Math.round((e.loaded * 100) / e.total);
                        _self.onProgress(progress);
                    }
                }
                
            })
            .then(function(data){
                const response ={type: _self.fileInfo.type, fileName:_self.fileInfo.fileName, filesize:_self.fileInfo.fileSize, fileUrl: data.data, mediaName: _self.fileInfo.mediaName, blobUrl: _self.blobUrl}
                if (_self.onSuccess){} _self.onSuccess(response);
                // store.dispatch({
                //     type: UPLOAD_TEMPALTEICON_STATUS,
                //     payload: response
                // })
            }
            )
            
            .catch(function() {
                if(_self?.source?.token?.reason?.message !== "Upload aborted by the user."){
                    _self.onError('FILE_UPLOAD_ERROR');
                 }
            });

        }else {
            axios.post(this.baseUrl + "users/" + this.userInfoId + "/file", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': "bearer " + this.accessToken
                },
                cancelToken : this.source?.token,
                onUploadProgress: function(e) {
                    if (_self.onProgress) {
                        const progress = Math.round((e.loaded * 100) / e.total);
                        const response = _self.fileContext === 'sendEmail' ? {fileType: _self.fileInfo.type, fileName:_self.fileInfo.fileName, filesize:_self.fileInfo.fileSize, mediaName: _self.fileInfo.mediaName, progress} : progress;
                        _self.onProgress(response);
                    }
                }
            })
            .then(function(data){
                if(_self.boardId && _self.pageId && (data.data.fileType == 'audio' || data.data.fileType == 'video')){
                    try{
                    axios.get(_self.baseUrl+'ka/users/' +_self.userInfoId +'/'+pageId+'/' + data.data.fileId + '/signedMediaURL',
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': "bearer " + _self.accessToken
                        }
                    }).then(function(res) {
                            if(res.data.mediaUrl) {
                                const response = {type: _self.fileInfo.type, fileName:_self.fileInfo.fileName, filesize:_self.fileInfo.fileSize, fileUrl: data.data, mediaName: _self.fileInfo.mediaName, blobUrl: _self.blobUrl,mediaUrl:res.data.mediaUrl}
                                if (_self.onSuccess) _self.onSuccess(response);
                            }
                        });
                    }catch(err){
                        console.error("failed api call",err);
                    }
                }else{
                    let response = {type: _self.fileInfo.type, fileName:_self.fileInfo.fileName, filesize:_self.fileInfo.fileSize, fileUrl: data.data, mediaName: _self.fileInfo.mediaName, blobUrl: _self.fileInfo?.blobUrl}
                    // if(_self.fileInfo.height) {
                    //     response.height = _self.fileInfo.height;
                    // }
                    // if(_self.fileInfo.width) {
                    //     response.width = _self.fileInfo.width;
                    // }
                    if (_self.onSuccess) _self.onSuccess(response);
                }
            })
            .catch(function() {
             if(_self?.source?.token?.reason?.message !== "Upload aborted by the user."){
                _self.onError('FILE_UPLOAD_ERROR');
             }
            });
        }
        
    };

    this._commitFile = function () {
        const _self = this;
        const totalChunks = _self._v2 ? _self.fileInfo.uploadStrategy.chunksCount : this.fileInfo.totalChunks;
        let url = this.baseUrl + "users/" + this.userInfoId + "/file/" + this.fileInfo.fileToken;

        const payload = {
            "fileContext": this.fileContext,
            "filename": this.fileInfo.fileName,
            "fileExtension": this.fileInfo.fileType,
            "totalChunks": totalChunks,
            "uploadedChunks": this.uploadedChunks
        }

        let formData = new FormData();
        formData.append('totalChunks', totalChunks);
        formData.append('messageToken', this.fileInfo.fileToken);
        formData.append('fileExtension', this.fileInfo.fileType);
        formData.append('fileType', this.fileInfo.type);
        formData.append('filename', this.fileInfo.fileName);
        formData.append('fileContext', this.fileContext);
        if(resourceId)formData.append("resourceId" ,resourceId);
        if(resourceType)formData.append("resourceType" ,resourceType);
        if(rowId)formData.append("rowId" ,rowId);
        if(tableId)formData.append("tableId" ,tableId);
        
        if(this.uploadedChunks) {
            formData.append("uploadedChunks" ,_self.uploadedChunks);
        }
        if(this.pageId ){
            formData.append('pageId',this.pageId);
        }
        if(this.boardId){
            formData.append('boardId',this.boardId);
        }
        if (this.fileInfo.isThumbnail) {
            formData.append('thumbnailUpload', true);
            let thumbnail = this.dataURLtoFile(this.fileInfo.thumbnailData, this.fileInfo.name + '_thumb');
            formData.append('thumbnail', thumbnail);
        } else {
            formData.append('thumbnailUpload', false);
        }
        if(this.fileInfo?.height){
            formData.append('height',this.fileInfo?.height);
        }
        if(this.fileInfo?.width){
            formData.append('width',this.fileInfo?.width);
        }
        axios.put(url, _self._v2 ? payload : formData, {
                headers: {
                    'Content-Type': _self._v2 ? 'application/json' : 'multipart/form-data',
                    'Authorization': "bearer " + this.accessToken
                },
                cancelToken : this.source?.token,
            })
            .then(function(data){
                if (_self.onProgress) {
                    const progress = Math.floor((_self.currentChunk / _self.fileInfo.totalChunks) * 100);
                    const response = _self.fileContext === 'sendEmail' ? {fileType: _self.fileInfo.type, fileName:_self.fileInfo.fileName, filesize:_self.fileInfo.fileSize, mediaName: _self.fileInfo.mediaName, progress} : progress;
                    _self.onProgress(response);
                }
                if(_self.boardId && _self.pageId && (_self.fileInfo.type == 'video' ||  _self.fileInfo.type == 'audio')){
                    try{
                        axios.get(_self.baseUrl+'ka/users/' +_self.userInfoId +'/'+_self.pageId+'/' + data.data.fileId + '/signedMediaURL',
                        {
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': "bearer " + _self.accessToken
                            },
                            cancelToken : this.source?.token
                        }).then(function(res) {
                            if(res.data.mediaUrl){
                                const response ={type: _self.fileInfo.type,fileName:_self.fileInfo.fileName,filesize:_self.fileInfo.fileSize, fileUrl: data.data, blobUrl: _self.blobUrl, duration: _self.fileDuration, mediaName: _self.fileInfo.mediaName,mediaUrl:res.data.mediaUrl, lMod: _self.file.lastModified}
                                if (_self.onSuccess) _self.onSuccess(response);
                            
                            }
                        });
                    }catch(err){
                        console.error("failed api call",err);
                    }
                } else {
                    const response ={type: _self.fileInfo.type,fileName:_self.fileInfo.fileName,filesize:_self.fileInfo.fileSize, fileUrl: data.data, blobUrl: _self.blobUrl, duration: _self.fileDuration, mediaName: _self.fileInfo.mediaName, lMod: _self.file.lastModified, uID : _self.fileInfo.uniqueID}
                    if (_self.onSuccess) _self.onSuccess(response);
                }
            })
            .catch(function() {
                if(_self?.source?.token?.reason?.message !== "Upload aborted by the user."){
                    _self.onError('FILE_UPLOAD_ERROR');
                 }
            }
        );
    };

    this._uploadChunk = function (chunk) {
        const _self = this;
        const url = this.baseUrl + "users/" + this.userInfoId + "/file/" + this.fileInfo.fileToken + "/chunk";
        let formData = new FormData();
        formData.append('chunkNo', this.currentChunk);
        formData.append('messageToken', this.fileInfo.fileToken);
        formData.append('chunk', _self.dataURLtoFile(chunk, this.fileInfo.fileName));
        if(this.pageId ){
            formData.append('pageId',this.pageId);
        }
        if(this.boardId){
            formData.append('boardId',this.boardId);
        }
        axios.post(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': "bearer " + this.accessToken
            },
            cancelToken : this.source?.token
        })
        .then(function(data){
            _self.currentChunk++;
            if (_self.currentChunk === _self.fileInfo.totalChunks) {
                _self._commitFile();
            } else {
                _self._initChunkUpload();
            }
        })
        .catch(function() {
            if(_self?.source?.token?.reason?.message !== "Upload aborted by the user."){
                _self.onError('FILE_UPLOAD_ERROR');
             }
        });
    };

    this._uploadChunk_v2 = function (url, chunk, currentChunk) {
        const _self = this;
        const chunkNo = parseInt(getQueryParams(url)?.partNumber, 10);
        // const url = _self.fileInfo.uploadStrategy.chunkURLs[_self.currentChunk];
        // const urls = _self.fileInfo.uploadStrategy.chunkURLs;
        axios({
            url,
            method: _self.fileInfo.uploadStrategy.httpMethod,
            data: _self.dataURLtoFile(chunk, this.fileInfo.fileName),
            // data: chunk,
            // data: Buffer.from(chunk),
            headers: {
                "Content-Type": ""
            },
            cancelToken : this.source?.token,
        })
        .then(function(data){
            if(!_self.uploadedChunks) {
                _self.uploadedChunks = []
            }
            _self.uploadedChunks.push({
                chunkNo,
                "ETag": data.headers['etag'].replace(/\"/g, "")
            })

            _self.successChunks++;
            if (_self.successChunks === _self.fileInfo.uploadStrategy.chunksCount) {
                _self._commitFile();
            }
            // console.log(data.headers['etag']);
            // if (_self.currentChunk === _self.fileInfo.uploadStrategy.chunksCount) {
            //     // _self._commitFile();
            // } else {
            //     _self._initChunkUpload();
            // }
        })
        .catch(function() {
            if(_self?.source?.token?.reason?.message !== "Upload aborted by the user."){
                _self.onError('FILE_UPLOAD_ERROR');
             }
        });
    };

    this._initChunkUpload = function () {
        const _self = this;
        const totalChunks = _self._v2 ? _self.fileInfo.uploadStrategy.chunksCount : this.fileInfo.totalChunks;
        const chunkSize = _self._v2 ? _self.fileInfo.uploadStrategy.chunkSize : this.CHUNK_SIZE;
        const start = this.currentChunk * chunkSize;
        const end = (this.currentChunk === totalChunks - 1) ? this.file.size : (this.currentChunk + 1) * chunkSize;
        if (this.onProgress) {
            const progress = Math.floor((this.currentChunk / totalChunks) * 100);
            const response = _self.fileContext === 'sendEmail' ? {fileType: _self.fileInfo.type, fileName:_self.fileInfo.fileName, filesize:_self.fileInfo.fileSize, mediaName: _self.fileInfo.mediaName, progress} : progress;
            this.onProgress(response);
        }
        const blob = this.file.slice(start, end);
        let reader = new FileReader();
        reader.onloadend = (e) => {
            if (e.target.readyState === FileReader.DONE) {
                const chunk = e.target.result;
                // const base64Data = e.target.result.split(',')[1]
                // const base64Url = reader.result;
                if(_self._v2) {
                    if (_self.currentChunk === _self.fileInfo.uploadStrategy.chunksCount) {
                        return;
                    }
                    const url = _self.fileInfo.uploadStrategy.chunkURLs[_self.currentChunk];
                    _self._uploadChunk_v2(url, chunk, _self.currentChunk)

                    _self.currentChunk++;
                    _self._initChunkUpload();
                } else {
                    _self._uploadChunk(chunk);
                }
            }
        };
        reader.readAsDataURL(blob);
    };

    this._readyForUpload = function () {
        // if(resourceId){
        //   return  this._uploadFile();
        // }
        if (this.fileInfo.isChunkUpload || this._v2) { // v2 always upload files in chunk
            this._initChunkUpload();
        } else {
            this._uploadFile();
        }
    };

    this._getFileToken = function () {
        const _self = this;
        const payload = {
            "fileContext": this.fileContext, // needs to take from arguments could be different for other places like email and slack
            "filename": _self.file.name,
            "fileContentType": _self.file.type,
            "fileType": this.fileInfo.type,
            "fileExtension": getFileExtension(_self.file.name),
            "fileSize": _self.file.size,
            // "target": "storage"
        }
        if(this.fileContext === "integration") {
            payload.resourceId = resourceId
            payload.resourceType = resourceType
            payload.scope = scope
        }
        axios.post(this.baseUrl + "users/" + this.userInfoId + "/file/token", payload, {
        // axios.post(this.baseUrl + "users/" + this.userInfoId + "/file/token", _v2 ? payload : {}, {
            headers: {
                Authorization: "bearer " + this.accessToken
            },
            cancelToken : this.source?.token
        })
        .then(function(data) {
            _self.fileInfo.fileToken = data.data.fileToken;
            _self.fileInfo.fileTokenExpiresOn = data.data.expiresOn;
            _self._v2 = data.data?.uploadStrategy?.target === "storage" ? true : false;
            if(_self._v2) {
                _self.fileInfo.uploadStrategy = data.data.uploadStrategy;
            }
            _self._readyForUpload();
        })
        .catch(function(error){
            /*Adding proper error to codes to handle the ERROR */
            if(error?.response?.data?.errors?.length){
                _self.onError(error?.response?.data?.errors?.[0])
                return;
            }
            if(_self?.source?.token?.reason?.message !== "Upload aborted by the user."){
                _self.onError('FILE_TOKEN_CREATION_ERROR');
             }
        });
    };

    this._generateThumbnail = function () {
        const _self = this;
        let reader = new FileReader();
        reader.onload = function(e) {
            let blob = new Blob([e.target.result], {
                type: _self.file.type
            });
            let url = (URL || webkitURL).createObjectURL(blob);
            _self.fileInfo.blobUrl = url;
            if (_self.fileInfo.type === 'video') {
                let video = document.createElement('video');
                video.preload = 'metadata';
                video.autoplay = true;
                video.muted =true;
                video.addEventListener('loadeddata', function (){
                    _self.fileInfo.thumbnailData = _self.getDataURL(video);
                    video.pause =true;
                    let finalDuration=_self.getDuration(video.duration);
                    _self.fileDuration=finalDuration;
                    _self.blobUrl =url;
                    // cacheBlob(url).then(()=>_self._getFileToken())
                    _self._getFileToken()
                    
                });
                video.addEventListener('error', function() {
                    (URL || webkitURL).revokeObjectURL(url);
                });
                video.src = url;
            } else if (_self.fileInfo.type === 'image') {
                let img = new Image();
                img.addEventListener('load', function () {
                    _self.fileInfo.thumbnailData = _self.getDataURL(img);
                    _self.fileInfo.width = img.width;
                    _self.fileInfo.height = img.height;
                    // (URL || webkitURL).revokeObjectURL(url);
                    // _self._getFileToken();
                    _self.blobUrl= url;
                    // cacheBlob(url).then(()=>_self._getFileToken());
                    _self._getFileToken()
                   
                });
                img.addEventListener('error', function() {
                    (URL || webkitURL).revokeObjectURL(url);
                });
                img.src = url;  
            }
            else if (_self.fileInfo.type === 'audio') {
                let audio = document.createElement('audio');
                audio.addEventListener('loadeddata', function () {
                    let finalDuration=_self.getDuration(audio.duration);
                    _self.fileDuration=finalDuration;
                    _self.blobUrl =url;
                    // cacheBlob(url).then(()=>_self._getFileToken());
                    _self._getFileToken()
                });
                audio.addEventListener('error', function() {
                    (URL || webkitURL).revokeObjectURL(url);
                });
                audio.src= url;
            }
            else if(_self.fileInfo.fileType === 'pdf' || _self.fileInfo.fileType === 'txt') {
                _self.blobUrl = url;
                // cacheBlob(url).then(()=>_self._getFileToken())
                _self._getFileToken()
                // .catch((e)=>console.error(e));
            }
            
        }
        reader.readAsArrayBuffer(this.file);
    };

    this.getDuration= function(duration){
        let minutes = Math.floor(duration / 60);
        const nums = duration - minutes * 60;
        const seconds =parseInt(nums);
        if(minutes.toString().length < 2){
            minutes= "0"+ minutes ;
        }
        minutes = minutes.toString();
        const finalDuration = minutes + " : " + seconds;
        return finalDuration;
    }

    this.getUID=function(pattern){
        let _pattern = pattern || 'xxxxyx';
        _pattern = _pattern.replace(/[xy]/g, function (c) {
            let r = Math.random() * 16 | 0,
                v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        return _pattern;
    }

    this._validateFile = function (){
        if(this.file.type === 'paste' && this.file?.clipboardData?.files?.[0]) {
            this.file = this.file.clipboardData.files[0]
        }
        if (this.file && (this.file.name)) {
            this.fileInfo = {
                fileName: this.file.name,
                mediaName: this.mediaName,
                fileType: this.file.name.split('.').pop().toLowerCase(),
                fileSize: this.file.size,
                uniqueID : this.uID,
                title : this.file.name
            };

            if (this.allowedFileTypes?.indexOf(this.fileInfo.fileType) !== -1) {
                this.fileInfo.isChunkUpload = this.fileInfo.fileSize > this.CHUNK_SIZE_INITIAL;
                this.fileInfo.totalChunks = (this.fileInfo.isChunkUpload) ? (Math.floor(this.fileInfo.fileSize / this.CHUNK_SIZE) + 1) : 1;
                if (this.filetypes?.audio?.indexOf(this.fileInfo.fileType) !== -1) {
                    this.fileInfo.type = 'audio';
                    this.fileInfo.isThumbnail = false;
                    this._generateThumbnail();
                } else if (this.filetypes?.video?.indexOf(this.fileInfo.fileType) !== -1) {
                    this.fileInfo.type = 'video';
                    this.fileInfo.isThumbnail = true;
                    this._generateThumbnail();
                } else if (this.filetypes?.image?.indexOf(this.fileInfo.fileType) !== -1) {
                    this.fileInfo.type = 'image';
                    this.fileInfo.isThumbnail = true;
                    this._generateThumbnail();
                } else {
                    this.fileInfo.type = 'attachment';
                    this.fileInfo.isThumbnail = false;
                    if(this.fileInfo.fileType === "pdf" || this.fileInfo.fileType === 'txt') {
                        this._generateThumbnail();
                    } else {
                        this._getFileToken();
                    }
                }
                
            } else {
                this.onError('INVALID_FILE_FORMAT',this.fileInfo);
            }
        } else {
            this.onError('FILE_NAME_MISSING',this.fileInfo);
        }
    };
    
    this.start = function(onProgress = null, onSuccess = null, onError = null) {
        this.onProgress = onProgress;
        this.onSuccess = onSuccess;
        this.onError = onError;
        this._validateFile();
    };
    this.onError = function(msg) {
        console.error(msg);
    }
    return this;
};

export default FileUploader;

