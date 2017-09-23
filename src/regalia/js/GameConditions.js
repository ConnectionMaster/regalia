var GameConditions = {
    testCondition: function (tempcond, AdditionalInputData, conditionAction, conditionTimerInvocation, loopObj) {
        var bResult = true;
        var counter = 0;

        function performLoopIteration() {
            if (Globals.loopArgs.idx < Globals.loopArgs.array.length) {
                Globals.loopArgs.object = Globals.loopArgs.array[Globals.loopArgs.idx];
                Globals.loopArgs.idx++;

                GameCommands.insertToMaster([tempcond], undefined, conditionAction);
                GameCommands.insertToMaster(tempcond.PassCommands, undefined, conditionAction);
            } else {
                ResetLoopObjects();
            }
        }

        for (var i = 0; i < tempcond.Checks.length; i++) {
            try {
                var tempcheck = tempcond.Checks[i];
                if (counter > 0) {
                    if (tempcheck.CkType == "Or") {
                        if (bResult == true)
                            break;
                    } else if (tempcheck.CkType == "And") {
                        if (bResult == false)
                            continue;
                    }
                }
                counter++;

                var step2 = PerformTextReplacements(tempcheck.ConditionStep2, loopObj);
                var step3 = PerformTextReplacements(tempcheck.ConditionStep3, loopObj);
                var step4 = PerformTextReplacements(tempcheck.ConditionStep4, loopObj);
                var objectBeingActedUpon = CommandLists.objectBeingActedUpon() || Globals.theObj;

                switch (tempcheck.CondType) {
                    case "CT_Loop_While": {
                        if (this.testVariable(step2, step3, step4)) {
                            GameCommands.insertToMaster([tempcond], undefined, conditionAction);
                            GameCommands.insertToMaster(tempcond.PassCommands, undefined, conditionAction);
                        }
                        break;
                    }
                    case "CT_Loop_Rooms": {
                        if (Globals.loopArgs.array == null)
                            Globals.loopArgs.array = TheGame.Rooms;
                        performLoopIteration();
                        break;
                    }
                    case "CT_Loop_Exits": {
                        if (Globals.loopArgs.array == null) {
                            var temproom = GetRoom(step2);
                            if (temproom != null) {
                                Globals.loopArgs.array = temproom.Exits;
                            }
                        }
                        performLoopIteration();
                        break;
                    }
                    case "CT_Loop_Characters": {
                        if (Globals.loopArgs.array == null)
                            Globals.loopArgs.array = TheGame.Characters;
                        performLoopIteration();
                        break;
                    }
                    case "CT_Loop_Item_Group": {
                        if (Globals.loopArgs.array == null) {
                            Globals.loopArgs.array = TheGame.Objects.filter(function (item) {
                                return item.GroupName === step2;
                            });
                        }
                        performLoopIteration();
                        break;
                    }
                    case "CT_Loop_Item_Char_Inventory": {
                        if (Globals.loopArgs.array == null) {
                            Globals.loopArgs.array = TheGame.Objects.filter(function (item) {
                                return item.locationtype === "LT_CHARACTER" && item.locationname === step2;
                            });
                        }
                        performLoopIteration();
                        break;
                    }
                    case "CT_Loop_Item_Container": {
                        if (Globals.loopArgs.array == null) {
                            Globals.loopArgs.array = TheGame.Objects.filter(function (item) {
                                return item.locationtype === "LT_IN_OBJECT" && item.locationname === step2;
                            });
                        }
                        performLoopIteration();
                        break;
                    }
                    case "CT_Loop_Item_Inventory": {
                        if (Globals.loopArgs.array == null) {
                            Globals.loopArgs.array = TheGame.Objects.filter(function (item) {
                                return item.locationtype === "LT_PLAYER";
                            });
                        }
                        performLoopIteration();
                        break;
                    }
                    case "CT_Loop_Item_Room": {
                        if (Globals.loopArgs.array == null) {
                            Globals.loopArgs.array = TheGame.Objects.filter(function (item) {
                                return item.locationtype === "LT_ROOM" && item.locationname === step2;
                            });
                        }
                        performLoopIteration();
                        break;
                    }
                    case "CT_Loop_Items": {
                        if (Globals.loopArgs.array == null) {
                            Globals.loopArgs.array = TheGame.Objects;
                        }
                        performLoopIteration();
                        break;
                    }
                    default: {
                        bResult = this.booleanConditionResult(tempcond, tempcheck, step2, step3, step4, objectBeingActedUpon, conditionAction, conditionTimerInvocation);
                    }
                }
            } catch (err) {
                alert("Rags can not process the condition check correctly.  If you are the game author," + " please correct the error in this conditon:" + tempcond.conditionname + " check:" +
                    tempcheck.CondType + " - " + tempcheck.ConditionStep2 + " - " +
                    tempcheck.ConditionStep3 + " - " + tempcheck.ConditionStep4);
            }
        }
        if (!Globals.loopArgs.array) {
            Logger.logEvaluatedCondition(tempcond, bResult);
        }
        return bResult;
    },

    testVariable: function (step2, step3, step4) {
        var bResult = true;
        var tempvar = GetVariable(step2);
        if (tempvar != null) {
            var varindex = GetArrayIndex(step2, 0);
            var varindex2 = GetArrayIndex(step2, 1);
            var replacedstring = PerformTextReplacements(step4, null);
            if (tempvar.vartype == "VT_DATETIMEARRAY" || tempvar.vartype == "VT_DATETIME") {
                // Do Nothing
            } else if (tempvar.vartype == "VT_NUMBERARRAY" || tempvar.vartype == "VT_NUMBER") {
                if (varindex != -1) {
                    if (varindex2 != -1) {
                        tempvar.dNumType = parseFloat(tempvar.VarArray[varindex][varindex2]);
                    } else
                        tempvar.dNumType = tempvar.VarArray[varindex];
                }
                if (step3 == "Equals") {
                    bResult = parseFloat(replacedstring) == tempvar.dNumType;
                } else if (step3 == "Not Equals") {
                    bResult = parseFloat(replacedstring) != tempvar.dNumType;
                } else if (step3 == "Greater Than") {
                    bResult = tempvar.dNumType > parseFloat(replacedstring);
                } else if (step3 == "Greater Than or Equals") {
                    bResult = tempvar.dNumType >= parseFloat(replacedstring);
                } else if (step3 == "Less Than") {
                    bResult = tempvar.dNumType < parseFloat(replacedstring);
                } else if (step3 == "Less Than or Equals") {
                    bResult = tempvar.dNumType <= parseFloat(replacedstring);
                }
            } else if (tempvar.vartype == "VT_STRINGARRAY" || tempvar.vartype == "VT_STRING") {
                if (varindex != -1) {
                    if (varindex2 != -1)
                        tempvar.sString = tempvar.VarArray[varindex][varindex2].toString();
                    else
                        tempvar.sString = tempvar.VarArray[varindex].toString();
                }
                if (step3 == "Equals") {
                    bResult = replacedstring == tempvar.sString;
                } else if (step3 == "Not Equals") {
                    bResult = replacedstring != tempvar.sString;
                } else if (step3 == "Contains") {
                    bResult = tempvar.sString.indexOf(replacedstring) > -1;
                } else if (step3 == "Greater Than") {
                    bResult = tempvar.sString > replacedstring;
                } else if (step3 == "Less Than") {
                    bResult = tempvar.sString < replacedstring;
                }
            }
        }
        if ((tempvar === undefined) && (step3 === "Contains")) {
            // HACK - preserve bug compatibility with desktop RAGS client
            // It seems like a "varname Contains val" query passes
            // if varname does not exist. Not sure how many other
            // situations this applies to. This is needed to get past
            // the opening quiz questions in Evil, Inc. where the
            // variable names have been typoed.
            return true;
        }
        return bResult;
    },

    booleanConditionResult: function (tempcond, tempcheck, step2, step3, step4, objectBeingActedUpon, conditionAction, conditionTimerInvocation) {
        switch (tempcheck.CondType) {
            case "CT_Item_InGroup": {
                return GetObject(step2).GroupName == step3;
            }
            case "CT_MultiMedia_InGroup": {
                throw new Error("CT_MultiMedia_InGroup not implemented!");
            }
            case "CT_Item_Held_By_Player": {
                var tempobj = GetObject(step2);
                if (!tempobj) {
                    return false;
                }

                if (tempobj.locationtype == "LT_PLAYER") {
                    return true;
                } else if (tempobj.locationtype == "LT_IN_OBJECT") {
                    return CheckItemInInventory(tempobj);
                } else {
                    return false;
                }
            }
            case "CT_Player_Moving": {
                return Globals.movingDirection == step2;
            }
            case "CT_Player_Gender": {
                if (step2 == "Male")
                    return TheGame.Player.PlayerGender == "Male";
                else if (step2 == "Female")
                    return TheGame.Player.PlayerGender == "Female";
                else
                    return TheGame.Player.PlayerGender == "Other";
            }
            case "CT_Character_Gender": {
                var tempchar = GetCharacter(step2);
                if (tempchar != null) {
                    if (step3 == "Male")
                        return tempchar.CharGender == "Male";
                    else if (step3 == "Female")
                        return tempchar.CharGender == "Female";
                    else
                        return tempchar.CharGender == "Other";
                }
                break;
            }
            case "CT_Character_In_Room": {
                var tempchar = GetCharacter(step2);
                if (step3 == CurrentRoomGuid) {
                    var currentroom = GetRoom(TheGame.Player.CurrentRoom);
                    return tempchar.CurrentRoom == currentroom.UniqueID;
                } else {
                    return (tempchar.CurrentRoom == step3);
                }
            }
            case "CT_Character_In_RoomGroup": {
                var tempchar = GetCharacter(step2);
                var temproom = GetRoom(tempchar.CurrentRoom);
                if (temproom != null) {
                    if (temproom.Group == step3)
                        return true;
                }
                return false;
            }
            case "CT_Item_Held_By_Character": {
                var tempobj = GetObject(step3);
                if (tempobj != null) {
                    if (tempobj.locationtype == "LT_CHARACTER" && tempobj.locationname == step2)
                        return true;
                    else
                        return false;
                } else
                    return false;
            }
            case "CT_Item_Not_Held_By_Player": {
                var tempobj = GetObject(step2);
                if (tempobj != null)
                    return tempobj.locationtype != "LT_PLAYER";
                else
                    return false;
            }
            case "CT_Item_In_Object": {
                var tempobj = GetObject(step2);
                if (tempobj != null)
                    return tempobj.locationtype == "LT_IN_OBJECT" && tempobj.locationname == step3;
                else
                    return false;
            }
            case "CT_Item_Not_In_Object": {
                var tempobj = GetObject(step2);
                if (tempobj != null) {
                    var iteminobject = tempobj.locationtype == "LT_IN_OBJECT" && tempobj.locationname == step3;
                    return !iteminobject;
                } else
                    return true;
            }
            case "CT_Item_In_Room": {
                if (step3 == CurrentRoomGuid) {
                    var tempobj = GetObject(step2);
                    var currentroom = GetRoom(TheGame.Player.CurrentRoom);
                    if (tempobj != null)
                        return ((tempobj.locationtype == "LT_ROOM") && (tempobj.locationname == currentroom.UniqueID));
                    else
                        return false;
                } else {
                    var tempobj = GetObject(step2);
                    if (tempobj != null)
                        return tempobj.locationtype == "LT_ROOM" && (
                            (tempobj.locationname === step3) || (tempobj.locationname === GetRoom(step3).UniqueID)
                        );
                    else
                        return false;
                }
            }
            case "CT_Item_In_RoomGroup": {
                var tempobj = GetObject(step2);
                if (tempobj != null && tempobj.locationtype == "LT_ROOM") {
                    var temproom = GetRoom(tempobj.locationname);
                    if (temproom != null) {
                        if (temproom.Group == step3)
                            return true;
                    }
                }
                return false;
            }
            case "CT_Player_In_Room": {
                return TheGame.Player.CurrentRoom == step2;
            }
            case "CT_Player_In_RoomGroup": {
                var testroom = GetRoom(TheGame.Player.CurrentRoom);
                return (testroom.Group == step2);
            }
            case "CT_Player_In_Same_Room_As": {
                var curchar = GetCharacter(step2);
                return TheGame.Player.CurrentRoom == curchar.CurrentRoom;
            }
            case "CT_Room_CustomPropertyCheck": {
                var splits = step2.split(":");
                if (splits.length == 2) {
                    var roomname = splits[0];
                    var property = splits[1];
                    var temproom = null;
                    if (roomname == "<CurrentRoom>") {
                        temproom = GetRoom(TheGame.Player.CurrentRoom);
                    } else {
                        temproom = GetRoom(roomname);
                    }
                    if (temproom != null) {
                        for (var i = 0; i < temproom.CustomProperties.length; i++) {
                            var curprop = temproom.CustomProperties[i];
                            if (curprop.Name == property) {
                                return TestCustomProperty(curprop.Value, step3, step4);
                            }
                        }
                    }
                }
                break;
            }
            case "CT_Character_CustomPropertyCheck": {
                var splits = step2.split(":");
                if (splits.length == 2) {
                    var roomname = splits[0];
                    var property = splits[1];
                    var temproom = null;
                    temproom = GetCharacter(roomname);
                    if (temproom != null) {
                        for (var i = 0; i < temproom.CustomProperties.length; i++) {
                            var curprop = temproom.CustomProperties[i];
                            if (curprop.Name == property) {
                                return TestCustomProperty(curprop.Value, step3, step4);
                            }
                        }
                    }
                }
                break;
            }
            case "CT_Timer_CustomPropertyCheck": {
                var splits = step2.split(":");
                if (splits.length == 2) {
                    var roomname = splits[0];
                    var property = splits[1];
                    var temproom = null;
                    temproom = GetTimer(roomname);
                    if (temproom != null) {
                        for (var i = 0; i < temproom.CustomProperties.length; i++) {
                            var curprop = temproom.CustomProperties[i];
                            if (curprop.Name == property) {
                                return TestCustomProperty(curprop.Value, step3, step4);
                            }
                        }
                    }
                }
                break;
            }
            case "CT_Variable_CustomPropertyCheck": {
                var splits = step2.split(":");
                if (splits.length == 2) {
                    var roomname = splits[0];
                    var property = splits[1];
                    var temproom = null;
                    temproom = GetVariable(roomname);
                    if (temproom != null) {
                        for (var i = 0; i < temproom.CustomProperties.length; i++) {
                            var curprop = temproom.CustomProperties[i];
                            if (curprop.Name == property) {
                                return TestCustomProperty(curprop.Value, step3, step4);
                            }
                        }
                    }
                }
                break;
            }
            case "CT_Item_CustomPropertyCheck": {
                var splits = step2.split(":");
                if (splits.length == 2) {
                    var roomname = splits[0];
                    var property = splits[1];
                    var temproom = null;
                    if (roomname == "<Self>") {
                        if (objectBeingActedUpon) {
                            temproom = objectBeingActedUpon;
                        }
                    } else {
                        temproom = GetObject(roomname);
                    }
                    if (temproom != null) {
                        for (var i = 0; i < temproom.CustomProperties.length; i++) {
                            var curprop = temproom.CustomProperties[i];
                            if (curprop.Name == property) {
                                return TestCustomProperty(curprop.Value, step3, step4);
                            }
                        }
                    }
                }
                break;
            }
            case "CT_Player_CustomPropertyCheck": {
                var property = step2;
                for (var i = 0; i < TheGame.Player.CustomProperties.length; i++) {
                    var curprop = TheGame.Player.CustomProperties[i];
                    if (curprop.Name == property) {
                        return TestCustomProperty(curprop.Value, step3, step4);
                    }
                }
                break;
            }
            case "CT_Variable_Comparison": {
                return this.testVariable(step2, step3, step4);
            }
            case "CT_Variable_To_Variable_Comparison": {
                var tempvar = GetVariable(step2);
                var checkvar = GetVariable(step4);
                var varindex1 = GetArrayIndex(step2, 0);
                var varindex1a = GetArrayIndex(step2, 1);
                var varindex2 = GetArrayIndex(step4, 0);
                var varindex2a = GetArrayIndex(step4, 1);
                var compareval = "";
                if (checkvar.vartype == "VT_NUMBERARRAY" || checkvar.vartype == "VT_NUMBER") {
                    if (varindex2 == -1)
                        compareval = checkvar.dNumType.toString();
                    else {
                        if (varindex2a != -1)
                            compareval = checkvar.VarArray[varindex2][varindex2a];
                        else
                            compareval = checkvar.VarArray[varindex2];
                    }
                } else if (checkvar.vartype == "VT_STRINGARRAY" || checkvar.vartype == "VT_STRING") {
                    if (varindex2 == -1)
                        compareval = checkvar.sString;
                    else {
                        if (varindex2a != -1)
                            compareval = checkvar.VarArray[varindex2][varindex2a];
                        else
                            compareval = checkvar.VarArray[varindex2];
                    }
                }
                if (tempvar != null) {
                    if (tempvar.vartype == "VT_NUMBERARRAY" || tempvar.vartype == "VT_NUMBER") {
                        if (varindex1 != -1) {
                            if (varindex1a != -1)
                                tempvar.dNumType = tempvar.VarArray[varindex1][varindex1a];
                            else
                                tempvar.dNumType = tempvar.VarArray[varindex1];
                        }
                        var num1 = tempvar.dNumType;
                        var num2 = compareval;
                        if (step3 == "Equals") {
                            return num1 == num2;
                        } else if (step3 == "Not Equals") {
                            return num1 != num2;
                        } else if (step3 == "Greater Than") {
                            return num1 > num2;
                        } else if (step3 == "Greater Than or Equals") {
                            return num1 >= num2;
                        } else if (step3 == "Less Than") {
                            return num1 < num2;
                        } else if (step3 == "Less Than or Equals") {
                            return num1 <= num2;
                        }
                    } else if (tempvar.vartype == "VT_STRINGARRAY" || tempvar.vartype == "VT_STRING") {
                        var tempvarvalue = tempvar.sString;
                        if (varindex1 != -1) {
                            if (varindex1a != -1)
                                tempvarvalue = tempvar.VarArray[varindex1][varindex1a];
                            else
                                tempvarvalue = tempvar.VarArray[varindex1];
                        }
                        if (step3 == "Equals") {
                            return (compareval == tempvarvalue);
                        } else if (step3 == "Not Equals") {
                            return (compareval != tempvarvalue);
                        }
                    }
                }
                break;
            }
            case "CT_Item_State_Check": {
                var tempobj = GetObject(step2);
                if (!tempobj) {
                    return false;
                }

                if (step3 == "Open") {
                    return tempobj.bOpen == true;
                }
                if (step3 == "Closed") {
                    return tempobj.bOpen == false;
                }
                if (step3 == "Locked") {
                    return tempobj.bLocked == true;
                }
                if (step3 == "Unlocked") {
                    return tempobj.bLocked == false;
                }
                if (step3 == "Worn") {
                    return tempobj.bWorn == true;
                }
                if (step3 == "Removed") {
                    return tempobj.bWorn == false;
                }
                if (step3 == "Read") {
                    return tempobj.bRead == true;
                }
                if (step3 == "Unread") {
                    return tempobj.bRead == false;
                }
                if (step3 == "Visible") {
                    return tempobj.bVisible == true;
                }
                if (step3 == "Invisible") {
                    return tempobj.bVisible == false;
                }
                break;
            }
            case "CT_AdditionalDataCheck": {
                var datatocheck = "";
                if (Globals.additionalData &&
                    Globals.additionalDataContext.action == conditionAction &&
                    Globals.additionalDataContext.timerInvocation == conditionTimerInvocation)
                    datatocheck = Globals.additionalData;
                if (tempcond.AdditionalInputData)
                    datatocheck = tempcond.AdditionalInputData;
                if (conditionAction.InputType == "Text") {
                    return step4.toLowerCase() == datatocheck.toLowerCase();
                } else {
                    return step2.toLowerCase() == datatocheck.toLowerCase();
                }
            }
        }
        // Default to true if there was an early break or something.
        return true;
    },
};