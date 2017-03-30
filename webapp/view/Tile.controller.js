sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function(Controller) {
	"use strict";
	
	jQuery.sap.require("sap.ui.core.format.DateFormat");
	jQuery.sap.require("sap.ui.core.format.NumberFormat");
	
	return Controller.extend("view.Tile", {
	//return Controller.extend("convista.com.demo.dynamictile.view.Tile", {
		
		onInit: function(){
			var oView = this.getView(),
                oViewData = oView.getViewData(),
                oTileApi = oViewData.chip,
                that = this,
                oConfig = sap.ushell.components.tiles.utilsRT.getConfiguration(oTileApi, oTileApi.configurationUi.isEnabled(), false);
            
            this.navigationTargetUrl = oConfig.navigation_target_url;
            this.bIsDataRequested = false;
            //global counter to achieve a counter on template-based value creation
            this.templateCounter = 0;
            
            var data = sap.ushell.components.tiles.utilsRT.getDataToDisplay(oConfig, {
            	number: (oTileApi.configurationUi.isEnabled() ? 1234 : "...")
            });
            var oModel = new sap.ui.model.json.JSONModel({
                config: oConfig,
                data: data,
                nav: {navigation_target_url: (oTileApi.configurationUi && oTileApi.configurationUi.isEnabled() ? "" : this.navigationTargetUrl)},
                search: {
                    display_highlight_terms: []
                }
            });
            oView.setModel(oModel);

			// implement configurationUi contract: setup configuration UI
            if (oTileApi.configurationUi.isEnabled()) {
                oTileApi.configurationUi.setUiProvider(function () {
                    // attach configuration UI provider, which is essentially a components.tiles.dynamicapplauncher.Configuration
                    var oConfigurationUi = sap.ushell.components.tiles.utils.getConfigurationUi(oView, "view.Configuration");
                    oTileApi.configurationUi.attachCancel(that.onCancelConfiguration.bind(null, oConfigurationUi));
                    oTileApi.configurationUi.attachSave(that.onSaveConfiguration.bind(null, oConfigurationUi));
                    return oConfigurationUi;
                });

                this.getView().getContent()[0].setTooltip(
                    sap.ushell.components.tiles.utils.getResourceBundleModel().getResourceBundle()
                        .getText("edit_configuration.tooltip")
                );
            }/*else {
                if (!oTileApi.preview || !oTileApi.preview.isEnabled()) {
                    this.onUpdateDynamicData();
                }
            }*/
            
            // implement search contract
            if (oTileApi.search) {
                // split and clean keyword string (may be comma + space delimited)
                var sKeywords = oView.getModel().getProperty("/config/display_search_keywords");
                var aKeywords = jQuery.grep(sKeywords.split(/[, ]+/), function (n, i) { return n && n !== ""; });

                // add title and subtitle (if present) to keywords for better FLP searching
                if (oConfig.display_title_text && oConfig.display_title_text !== "" &&
                        aKeywords.indexOf(oConfig.display_title_text) === -1) {
                    aKeywords.push(oConfig.display_title_text);
                }
                if (oConfig.display_subtitle_text && oConfig.display_subtitle_text !== "" &&
                        aKeywords.indexOf(oConfig.display_subtitle_text) === -1) {
                    aKeywords.push(oConfig.display_subtitle_text);
                }
                if (oConfig.display_info_text && oConfig.display_info_text !== "" &&
                        aKeywords.indexOf(oConfig.display_info_text) === -1) {
                    aKeywords.push(oConfig.display_info_text);
                }

                // defined in search contract:
                oTileApi.search.setKeywords(aKeywords);
                oTileApi.search.attachHighlight(
                    function (aHighlightWords) {
                        // update model for highlighted search term
                        oView.getModel().setProperty("/search/display_highlight_terms", aHighlightWords);
                    }
                );
            }
            
            // implement bag update handler
            if (oTileApi.bag && oTileApi.bag.attachBagsUpdated) {
                // is only called by the FLP for bookmark tiles which have been updated via bookmark service
                oTileApi.bag.attachBagsUpdated(function (aUpdatedBagIds) {
                    if (aUpdatedBagIds.indexOf("tileProperties") > -1) {
                        sap.ushell.components.tiles.utils._updateTilePropertiesTexts(oView, oTileApi.bag.getBag('tileProperties'));
                    }
                });
            }

            // implement preview contract
            if (oTileApi.preview) {
                oTileApi.preview.setTargetUrl(this.navigationTargetUrl);
                oTileApi.preview.setPreviewIcon(oConfig.display_icon_url);
                oTileApi.preview.setPreviewTitle(oConfig.display_title_text);
            }

            // implement refresh contract
            if (oTileApi.refresh) {
                oTileApi.refresh.attachRefresh(this.refreshHandler.bind(null, this));
            }

            // attach the refresh handler also for the visible contract, as we would like
            // on setting visible to true, to directly go and call the oData call
            if (oTileApi.visible) {
                oTileApi.visible.attachVisible(this.visibleHandler.bind(this));
            }
			
			//Tile setup complete -> Custom Coding
			//***************************************************************************//
			//***************************************************************************//
			this.tileContainer = this.getView().getContent()[0];
			// set tile frame type to twobyone type
			this.tileContainer.setFrameType("TwoByOne");
			
			var oTileContainerModel = new sap.ui.model.json.JSONModel();
			
			this.tileContent = null;
			this.tileSecondContent = null;
			
			// SELECT WHAT TO DO DEPENDING ON THE FRAME TYPE
			switch(oConfig.frame_type){

        		// FIRST CASE -- Two by one tile with one chart
        		case "twoByOne1":
        			
					// set tile content frame type to twobyone type
					this.tileContainer.getTileContent()[0].setFrameType("TwoByOne");
					
        			// No input on XML AREA
        			if(!oConfig.display_tile_content_xml || oConfig.display_tile_content_xml === ""){
						// content of the tile
						this.tileContent = sap.ui.xmlfragment("view.MicroChartDemo",this);
					}
					// Input on XML AREA
					else{
						try{
							// content of two by one tile
							this.tileContent = sap.ui.xmlfragment({
								fragmentContent:oConfig.display_tile_content_xml
							}, this);
						}catch(e){
							jQuery.sap.log.error(e);
							jQuery.sap.log.error("Parsing error for given XML Fragment. Did you add the names spaces and fragment xml wrapper?");
						}
					}
					// set content
					this.tileContainer.getTileContent()[0].setContent(this.tileContent);
        			break;
        			
        		// SECOND CASE -- Two by one tile with two charts	
        		case "twoByOne2":
					// No input on both xml text areas
        			if((!oConfig.display_tile_content_xml || oConfig.display_tile_content_xml === "")&&(!oConfig.display_second_tile_content_xml || oConfig.display_second_tile_content_xml !== "")){
						// content of first part of tile
						this.tileContent = sap.ui.xmlfragment("view.MicroChartDemo",this);
						this.tileSecondContent = sap.ui.xmlfragment("view.MicroChartDemo",this);
					}
					// Input on both xml text areas
					else{
						try{
							// content of first chart
							this.tileContent = sap.ui.xmlfragment({
								fragmentContent:oConfig.display_tile_content_xml
							}, this);
							// content of second chart
							this.tileSecondContent = sap.ui.xmlfragment({
								fragmentContent:oConfig.display_second_tile_content_xml
							}, this);
						}catch(e){
							jQuery.sap.log.error(e);
							jQuery.sap.log.error("Parsing error for given XML Fragment. Did you add the names spaces and fragment xml wrapper?");
						}
						
					}
					// set content of first chart
					this.tileContainer.getTileContent()[0].setContent(this.tileContent);
					// set content of second chart
					this.tileContainer.addTileContent(new sap.m.TileContent({content:this.tileSecondContent}));
					// set footer of second chart
					this.tileContainer.getTileContent()[1].setFooter(oConfig.display_second_footer);
        			break;
        	}
			
			this.tileContainer.setModel(oTileContainerModel);
			
			// Header, subheader and footer for both kind of tiles
			this.tileContainer.setHeader(oConfig.display_title_text);
			this.tileContainer.setSubheader(oConfig.display_subtitle_text);
			this.tileContainer.getTileContent()[0].setFooter(oConfig.display_footer);
		},
		
		onPress: function(oEvent){
			var oView = this.getView(),
                oViewData = oView.getViewData(),
                oModel = oView.getModel(),
                sTargetUrl = oModel.getProperty("/nav/navigation_target_url"),
                oTileApi = oViewData.chip;
            if (oTileApi.configurationUi.isEnabled()) {
                oTileApi.configurationUi.display();
            } else if (sTargetUrl) {
                if (sTargetUrl[0] === '#') {
                    hasher.setHash(sTargetUrl);
                } else {
                    window.open(sTargetUrl, '_blank');
                }
            }
		},
		
		// configuration cancel handler
        onCancelConfiguration: function (oConfigurationView, successHandler, errorHandler) {
            // re-load old configuration and display
            var oViewData = oConfigurationView.getViewData(),
                oModel = oConfigurationView.getModel(),
            // tile model placed into configuration model by getConfigurationUi
                oTileModel = oModel.getProperty("/tileModel"),
                oTileApi = oViewData.chip,
                oCurrentConfig = sap.ushell.components.tiles.utilsRT.getConfiguration(oTileApi, false, false);
            oConfigurationView.getModel().setData({config: oCurrentConfig, tileModel: oTileModel}, false);
        },
        
        // configuration save handler
        onSaveConfiguration: function (oConfigurationView) {
            var
            // the deferred object required from the configurationUi contract
                oDeferred = jQuery.Deferred(),
                oModel = oConfigurationView.getModel(),
            // tile model placed into configuration model by getConfigurationUi
                oTileModel = oModel.getProperty("/tileModel"),
                oTileApi = oConfigurationView.getViewData().chip,
                aTileNavigationActions = sap.ushell.components.tiles.utils.tileActionsRows2TileActionsArray(oModel.getProperty("/config/tile_actions_rows")),
            // get the configuration to save from the model
                configToSave = {
                    display_icon_url : oModel.getProperty("/config/display_icon_url"),
                    // display_number_unit : oModel.getProperty("/config/display_number_unit"),
                    display_tile_content_xml : oModel.getProperty("/config/display_tile_content_xml"),
                    // property for knowing which frame type (1x1 or 2x1) was selected
                    frame_type : oModel.getProperty("/config/frame_type"),
                    
                    // properties for a TwoByOne tile
                    display_second_tile_content_xml : oModel.getProperty("/config/display_second_tile_content_xml"),
                    display_second_footer: oModel.getProperty("/config/display_second_footer"),
                    
                    display_footer : oModel.getProperty("/config/display_footer"),
                    service_url: oModel.getProperty("/config/service_url"),
                    service_refresh_interval: oModel.getProperty("/config/service_refresh_interval"),
                    navigation_use_semantic_object : oModel.getProperty("/config/navigation_use_semantic_object"),
                    navigation_target_url : oModel.getProperty("/config/navigation_target_url"),
                    navigation_semantic_object : jQuery.trim(oModel.getProperty("/config/navigation_semantic_object")) || "",
                    navigation_semantic_action : jQuery.trim(oModel.getProperty("/config/navigation_semantic_action")) || "",
                    navigation_semantic_parameters : jQuery.trim(oModel.getProperty("/config/navigation_semantic_parameters")),
                    display_search_keywords: oModel.getProperty("/config/display_search_keywords")
                };
            //If the input fields icon, semantic object and action are failing the input validations, then through an error message requesting the user to enter/correct those fields
            var bReject = sap.ushell.components.tiles.utils.checkInputOnSaveConfig(oConfigurationView);
            if (!bReject) {
                bReject = sap.ushell.components.tiles.utils.checkTileActions(oConfigurationView);
            }
            if (bReject) {
                oDeferred.reject("mandatory_fields_missing");
                return oDeferred.promise();
            }
            // overwrite target URL in case of semantic object navigation
            if (configToSave.navigation_use_semantic_object) {
                configToSave.navigation_target_url = sap.ushell.components.tiles.utilsRT.getSemanticNavigationUrl(configToSave);
                oModel.setProperty("/config/navigation_target_url", configToSave.navigation_target_url);
            }

            // use bag contract in order to store translatable properties
            var tilePropertiesBag = oTileApi.bag.getBag('tileProperties');
            tilePropertiesBag.setText('display_title_text', oModel.getProperty("/config/display_title_text"));
            tilePropertiesBag.setText('display_subtitle_text', oModel.getProperty("/config/display_subtitle_text"));
            // tilePropertiesBag.setText('display_info_text', oModel.getProperty("/config/display_info_text"));
            tilePropertiesBag.setText('display_search_keywords', configToSave.display_search_keywords);

            var tileNavigationActionsBag = oTileApi.bag.getBag('tileNavigationActions');
            //forward populating of tile navigation actions array into the bag, to Utils
            sap.ushell.components.tiles.utils.populateTileNavigationActionsBag(tileNavigationActionsBag, aTileNavigationActions);

            function logErrorAndReject(oError, oErrorInfo) {
                jQuery.sap.log.error(oError, null, "sap.ushell.components.tiles.applauncherdynamic.DynamicTile.controller");
                oDeferred.reject(oError, oErrorInfo);
            }

            // use configuration contract to write parameter values
            oTileApi.writeConfiguration.setParameterValues(
                {tileConfiguration : JSON.stringify(configToSave)},
                // success handler
                function () {
                    var oConfigurationConfig = sap.ushell.components.tiles.utilsRT.getConfiguration(oTileApi, false, false),
                    // get tile config data in admin mode
                        oTileConfig = sap.ushell.components.tiles.utilsRT.getConfiguration(oTileApi, true, false),
                    // switching the model under the tile -> keep the tile model
                        oModel = new sap.ui.model.json.JSONModel({
                            config: oConfigurationConfig,
                            // keep tile model
                            tileModel: oTileModel
                        });
                    oConfigurationView.setModel(oModel);

                    // update tile model
                    oTileModel.setData({data: oTileConfig, nav: {navigation_target_url: ""}}, false);
                    if (oTileApi.preview) {
                        oTileApi.preview.setTargetUrl(oConfigurationConfig.navigation_target_url);
                        oTileApi.preview.setPreviewIcon(oConfigurationConfig.display_icon_url);
                        oTileApi.preview.setPreviewTitle(oConfigurationConfig.display_title_text);
                    }

                    tilePropertiesBag.save(
                        // success handler
                        function () {
                            jQuery.sap.log.debug("property bag 'tileProperties' saved successfully");
                            // update possibly changed values via contracts
                            if (oTileApi.title) {
                                oTileApi.title.setTitle(
                                    configToSave.display_title_text,
                                    // success handler
                                    function () {
                                        oDeferred.resolve();
                                    },
                                    logErrorAndReject // error handler
                                );
                            } else {
                                oDeferred.resolve();
                            }
                        },
                        logErrorAndReject // error handler
                    );

                    tileNavigationActionsBag.save(
                        // success handler
                        function () {
                            jQuery.sap.log.debug("property bag 'navigationProperties' saved successfully");
                        },
                        logErrorAndReject // error handler
                    );
                },
                logErrorAndReject // error handler
            );

            return oDeferred.promise();
        },
		
		// convenience function to stop browser's timeout and OData calls
        stopRequests: function () {
            if (this.timer) {
                clearTimeout(this.timer);
            }
/*            if (this.oDataRequest) {
                try {
                    this.oDataRequest.abort();
                }catch (e){
                    jQuery.sap.log.warning(e.name,e.message);
                }
            }*/
        },
        // destroy handler stops requests
        onExit: function () {
            this.stopRequests();
        },
        
        // dynamic data updater
        onUpdateDynamicData: function () {
            var oView = this.getView(),
                oConfig = oView.getModel().getProperty("/config"),
                nservice_refresh_interval = oConfig.service_refresh_interval;
            if (!nservice_refresh_interval) {
                nservice_refresh_interval = 0;
            } else if (nservice_refresh_interval < 10) {
                nservice_refresh_interval = 10;
            }
            if (oConfig.service_url) {
                this.loadData(nservice_refresh_interval);
            }
        },
        
        // loads data from backend service
        loadData: function (nservice_refresh_interval) {
            var oDynamicTileView = this.getView(),
                oConfig = oDynamicTileView.getModel().getProperty("/config"),
                sUrl = oConfig.service_url,
                that = this;
            var oTileApi = this.getView().getViewData().chip;
            if (!sUrl) {
                return;
            }else{
            	var moveYahooDates = this.getUrlParameter("moveYahooDates",sUrl);
            	if(moveYahooDates){
					sUrl = this.getMovingDateInterval(sUrl);	
            	}
            }

            //set the timer if required
            if (nservice_refresh_interval > 0) {
                // call again later
                this.timer = window.setTimeout(that.loadData.bind(that, nservice_refresh_interval), (nservice_refresh_interval * 1000));
            }

            // Verify the the Tile visibility is "true" in order to issue an request
            if (oTileApi.visible.isVisible()) {
                this.bIsDataRequested = true;
                
                jQuery.ajax({
					url: sUrl,
					dataType: "jsonp",
					// The name of the callback parameter, as specified by the YQL service
    				jsonp: "callback",
    				cache: false,
    				success: function(json){
    					var model = that.tileContainer.getModel(); 
        				model.setData(json);
        				oConfig = that.getView().getModel().getProperty("/config");
        				var jsonFromString = null;
						
						var titleText = model.getProperty(oConfig.display_title_text);
						if(titleText){
							that.tileContainer.setHeader(titleText);	
						}
						jsonFromString = that.getJSONFromString(oConfig.display_subtitle_text);
						var subTitleText = "";
						if(jsonFromString.path){
							subTitleText = model.getProperty(jsonFromString.path);
							if(jsonFromString.formatter === ".formatDateTime"){
								subTitleText = that.formatDateTime(subTitleText);	
							}
						}else{
							subTitleText = model.getProperty(oConfig.display_subtitle_text);
						}
						if(subTitleText){
							that.tileContainer.setSubheader(subTitleText);	
						}
						jsonFromString = that.getJSONFromString(oConfig.display_footer);
						var footerText = "";
						if(jsonFromString.path){
							footerText = model.getProperty(jsonFromString.path);
							if(jsonFromString.formatter === ".formatDateTime"){
								footerText = that.formatDateTime(footerText);	
							}
						}else{
							footerText = model.getProperty(oConfig.display_footer);
						}
						if(footerText){
							var currentContent = that.tileContainer.getTileContent()[0];
							currentContent.setFooter(footerText);
						}
    				}
				});
            }
        },
        
        // loads data once if not in configuration mode
        refreshHandler: function (oController) {
            var oTileApi = oController.getView().getViewData().chip;
            if (!oTileApi.configurationUi.isEnabled()) {
            	var oConfig = oController.getView().getModel().getProperty("/config");
            	//load data with same interval as timer to ensure re-scheduling
                oController.loadData(oConfig.service_refresh_interval);
            } else {
                oController.stopRequests();
            }
        },

        // load data in place in case setting visibility from false to true
        // with no additional timer registered
        visibleHandler: function (isVisible) {
            /*var oView = this.getView(),
                oConfig = oView.getModel().getProperty("/config"),
                nservice_refresh_interval = oConfig.service_refresh_interval;*/
            if (isVisible) {
                if (!this.timer) {
                    this.onUpdateDynamicData();
                }
            } else {
                this.stopRequests();
            }
        },
        
        getMovingDateInterval: function(sourceUrl){
        	var today = new Date();
        	today.setHours(0);
    		today.setMinutes(0, 0, 0);
        	//in case contains startDate, extract it
        	var startDateIdx = sourceUrl.indexOf("startDate");
    		var startDate = null;
        	if(startDateIdx !== -1){
        		startDate = sourceUrl.substring(startDateIdx+13,startDateIdx+23);
        		startDate = new Date(startDate);
    			startDate.setHours(0);
    			startDate.setMinutes(0, 0, 0);
        	}
        	//in case contains endDate, extract it
        	var endDateIdx = sourceUrl.indexOf("endDate");
        	var endDate = null;
        	if(sourceUrl.indexOf("endDate") !== -1){
        		endDate = sourceUrl.substring(endDateIdx+11,endDateIdx+21);
        		endDate = new Date(endDate);
    			endDate.setHours(0);
    			endDate.setMinutes(0, 0, 0);        		
        	}
        	
        	if(startDate !== null && endDate !== null){
        		var dateDiff = this.daysBetween(endDate, today);
        		startDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + dateDiff);
        		startDate.setMinutes(startDate.getMinutes() - startDate.getTimezoneOffset());
        		endDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + dateDiff);
        		endDate.setMinutes(endDate.getMinutes() - endDate.getTimezoneOffset());
        		var startDateISO = startDate.toISOString().slice(0, 10);
        		var endDateISO = endDate.toISOString().slice(0, 10);
    			sourceUrl = sourceUrl.substring(0,startDateIdx) + "startDate=%27" + startDateISO + sourceUrl.substring(startDateIdx+23);
    			sourceUrl =	sourceUrl.substring(0,endDateIdx) + "endDate=%27" + endDateISO + sourceUrl.substring(endDateIdx+21);
        	}
        	return sourceUrl;
    	},
    	
    	daysBetween: function( date1, date2 ) {
		  //Get 1 day in milliseconds
		  var one_day = 1000 * 60 * 60 * 24;
		
		  // Convert both dates to milliseconds
		  var date1_ms = date1.getTime();
		  var date2_ms = date2.getTime();
		
		  // Calculate the difference in milliseconds
		  var difference_ms = date2_ms - date1_ms;
		    
		  // Convert back to days and return
		  return Math.round(difference_ms / one_day); 
		},
        
        getJSONFromString: function(string){
        	var result = null;
        	try{
        		result = JSON.parse(string);
        	}catch (e){
        		result = {};
        	}
			return result;
        },
        
        getUrlParameter: function(name, url) {
		    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
		    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
		    var results = regex.exec(url);
		    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
		},
        
        /********Formatter functions for callbacks*******************/
        
        formatDateTime: function(value){
	    	var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
	    		pattern: "d MMMM HH:mm:ss",
	    		style: "medium"
	    	});
	    	return oDateFormat.format(new Date(value));	
        },
        
        formatDateShort: function(value){
	    	var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
	    		pattern: "d MMMM",
	    		style: "short"
	    	});
	    	return oDateFormat.format(new Date(value));	
        },
        
        formatFloatValueColor: function(value){
        	var result = "";
        	var convertedValue = parseFloat(value);
        	if(convertedValue === 0){
        		result = "Neutral";
        	}else if(convertedValue < 0){
        		result = "Error";
        	}else if(convertedValue > 0){
        		result = "Good";
        	}else{
        		result = "Neutral";
        	}
        	return result;
        },
		
		formatFloatValueIndicator: function(value){
        	var result = "";
        	var convertedValue = parseFloat(value);
        	if(convertedValue === 0){
        		result = "None";
        	}else if(convertedValue < 0){
        		result = "Down";
        	}else if(convertedValue > 0){
        		result = "Up";
        	}else{
        		result = "None";
        	}
        	return result;
        },
        
        formatIntValueColor: function(value){
        	var result = "";
        	var convertedValue = parseInt(value);
        	if(convertedValue === 0){
        		result = "Neutral";
        	}else if(convertedValue < 0){
        		result = "Error";
        	}else if(convertedValue > 0){
        		result = "Good";
        	}else{
        		result = "Neutral";
        	}
        	return result;
        },
		
		formatIntValueIndicator: function(value){
        	var result = "";
        	var convertedValue = parseInt(value);
        	if(convertedValue === 0){
        		result = "None";
        	}else if(convertedValue < 0){
        		result = "Down";
        	}else if(convertedValue > 0){
        		result = "Up";
        	}else{
        		result = "None";
        	}
        	return result;
        },
        
        formatStringToFloat: function(value){
        	var parsed = parseFloat(value);
        	if(isNaN(parsed)){
        		jQuery.sap.log.warning("parsed Value "+value+" is not a number!");
        		return 0.0;
        	}
        	return parsed;
        },
        //global counter to achieve a counter on template-based value creation
        formatValueToCounter: function(value){
        	return this.templateCounter++;
        },
        
        formatValueShortNumber: function(value){
    		var numberFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
    			maxFractionDigits:1,
    			style:'short'
    		});
			return numberFormat.format(value);
        }
		
	});
});