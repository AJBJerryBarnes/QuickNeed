// extension to populate need items from the template table
//
// 1/5/23    v1.0 Jerry Barnes	Trial
// 15/5/23   v1.1 Jerry Barnes	Keep family numberfield visible so restart can be done
// 22/5/23	 v1.2 Jerry Barnes  Fix crash when template table defined but template fields not
// 30/5/23   v1.3 Jerry Barnes  Refer to requests items rather then need items
//
// 

import { FormField, Input, ViewPicker, initializeBlock,useGlobalConfig, useSettingsButton, 
	useBase, useRecords, expandRecord, Button, TextButton, ViewportConstraint,
	Box,
    Heading,
    ViewPickerSynced,
    RecordCard,
    TablePickerSynced,
    FieldPickerSynced} from '@airtable/blocks/ui';
import React, { useState  } from "react"; 
import { FieldType } from '@airtable/blocks/models';

const GlobalConfigKeys = {
    TEMPLATE_TABLE_ID: 'templateTableId',
	TEMPLATE_NAME_FIELD_ID: 'templateNameFieldId',
	TEMPLATE_TYPE_FIELD_ID: 'templateTypeFieldId',
	FAMILY_TABLE_ID: 'familyTableId',
	FAMILY_ID_FIELD_ID: 'idFieldId',
	FAMILY_SURNAME_FIELD_ID: 'surnameFieldId',
	FAMILY_ADDRESS_FIELD_ID: 'addressFieldId',
	FAMILY_POSTCODE_FIELD_ID: 'postcodeFieldId',
    NEED_TABLE_ID: 'needTableId',
	NEED_NAME_FIELD_ID: 'needNameFieldId',
	NEED_TYPE_FIELD_ID: 'needTypeFieldId',
    NEED_FAMILY_LINK_FIELD_ID: 'linkFieldId',

};


function Needs() {
	
	const VIEWPORT_MIN_WIDTH = 345;
    const VIEWPORT_MIN_HEIGHT = 200;

    const base = useBase();

	
    const globalConfig = useGlobalConfig();
	
    // Read the user's choice for which table and views to use from globalConfig.
	// we need the template table, the family table and the need table.
	// and the field on the need table which links to famil plus
	// name and address fields from family and the name of the name fields
	// on the need and template tables

    const templateTableId			= globalConfig.get(GlobalConfigKeys.TEMPLATE_TABLE_ID);
	const templateNameFieldId		= globalConfig.get(GlobalConfigKeys.TEMPLATE_NAME_FIELD_ID );
	const templateTypeFieldId		= globalConfig.get(GlobalConfigKeys.TEMPLATE_TYPE_FIELD_ID );
	const familyTableId				= globalConfig.get(GlobalConfigKeys.FAMILY_TABLE_ID);
	const idFieldId					= globalConfig.get(GlobalConfigKeys.FAMILY_ID_FIELD_ID);
	const surnameFieldId			= globalConfig.get(GlobalConfigKeys.FAMILY_SURNAME_FIELD_ID);
	const addressFieldId			= globalConfig.get(GlobalConfigKeys.FAMILY_ADDRESS_FIELD_ID);
	const postcodeFieldId			= globalConfig.get(GlobalConfigKeys.FAMILY_POSTCODE_FIELD_ID);
    const needTableId				= globalConfig.get(GlobalConfigKeys.NEED_TABLE_ID);
	const needNameFieldId			= globalConfig.get(GlobalConfigKeys.NEED_NAME_FIELD_ID);
	const needTypeFieldId			= globalConfig.get(GlobalConfigKeys.NEED_TYPE_FIELD_ID);
    const linkFieldId				= globalConfig.get(GlobalConfigKeys.NEED_FAMILY_LINK_FIELD_ID);
	
    const initialSetupDone = templateTableId && templateNameFieldId && templateTypeFieldId &&
							 familyTableId  && idFieldId &&
							 surnameFieldId && addressFieldId && postcodeFieldId && needTableId && 
							 needNameFieldId && needTypeFieldId && linkFieldId? true : false;

    // Use settings menu to hide away table pickers
    const [isShowingSettings, setIsShowingSettings] = useState(!initialSetupDone);
    useSettingsButton(function() {
        initialSetupDone && setIsShowingSettings(!isShowingSettings);
    });
	
    const familyTable = base.getTableByIdIfExists(familyTableId);
    const needTable = base.getTableByIdIfExists(needTableId);
    const templateTable = base.getTableByIdIfExists(templateTableId);
		
	const linkField = needTable ? needTable.getFieldByIdIfExists(linkFieldId) : null;
	const needNameField = needTable ? needTable.getFieldByIdIfExists(needNameFieldId) : null;
	const needTypeField = needTable ? needTable.getFieldByIdIfExists(needTypeFieldId) : null;
	
	const templateNameField = templateTable ? templateTable.getFieldByIdIfExists(templateNameFieldId) : null;
	const templateTypeField = templateTable ? templateTable.getFieldByIdIfExists(templateTypeFieldId) : null;

	const idField		= familyTable ? familyTable.getFieldByIdIfExists(idFieldId): null;
	const surnameField 	= familyTable ? familyTable.getFieldByIdIfExists(surnameFieldId) : null;
	const addressField  = familyTable ? familyTable.getFieldByIdIfExists(addressFieldId) : null;
	const postcodeField = familyTable ? familyTable.getFieldByIdIfExists(postcodeFieldId) : null;

	const [familyId, setFamilyId] = useState("");	
	const [familyRecId, setFamilyRecId] = useState("");
	
	//const [paymentRecId, setPaymentRecId] = useState("");	

	//const memberQuery = memberTable.selectRecords();
    //const memberRecordset = useRecords(memberQuery);
	
	const familyRecordset = useRecords(familyTable ? familyTable.selectRecords() : null);

    // the filter will find the family record matching the fieldid entered
	const familyRecords = familyRecordset ? familyRecordset.filter(family => {
			return (familyId.length > 0 && family.getCellValue(idField) == familyId)
		}) : null;
		
	const templateRecords = useRecords(templateTable && templateTypeField && templateNameField ? 
										templateTable.selectRecords(
											{sorts: [
												{field: templateTypeField},
												{field: templateNameField},
											]}
										) : null);  // do I need the select?

	if (isShowingSettings) {
        return (
            <ViewportConstraint minSize={{width: VIEWPORT_MIN_WIDTH, height: VIEWPORT_MIN_HEIGHT}}>
                <SettingsMenu
                    globalConfig={globalConfig}
                    base={base}
                    familyTable={familyTable}
					needTable={needTable}
                    templateTable={templateTable}
					linkField={linkField}
					needNameField={needNameField}
					needTypeField={needTypeField}
					addressField={addressField}
					postcodeField={postcodeField}
					templateNameField={templateNameField}
					templateTypeField={templateTypeField}
                    initialSetupDone={initialSetupDone}
                    onDoneClick={() => setIsShowingSettings(false)}
                />
            </ViewportConstraint>
        )
    } else {
		if (familyRecId){
			return (
				<div>
					<FormField label="Family number">
						<Input value={familyId} onChange={e => setIds(setFamilyId, e.target.value, setFamilyRecId, null)} />
					</FormField>			
					
					{familyRecords.map(record => (
						<li key={record.id}>
							<TextButton
								variant="dark"
								size="xlarge"
								onClick={() => {
									setFamilyRecId(record.id);
								}}
								
							>
							{record.getCellValue(surnameField)} ,
							</TextButton> 
							{record.getCellValue(addressField)} , {record.getCellValue(postcodeField)} 
							
						</li>
					))}
					<br />
					{templateRecords.map(record => (
						<li key={record.id}>
							<TextButton
								variant="dark"
								size="xlarge"
								onClick={() => {
									addNeedRecord(needTable, linkFieldId, needNameFieldId, record.getCellValue(templateNameField),
											needTypeFieldId, record.getCellValue(templateTypeField),familyRecId);
								}}
								
							>
							{record.getCellValue(templateNameField)} , 
							</TextButton> 
							{record.getCellValue(templateTypeField)}
						</li>
					))}
					
				</div>		
			);
			
		} else {
			return (
				<div>
					<FormField label="Family number">
						<Input value={familyId} onChange={e => setIds(setFamilyId, e.target.value, setFamilyRecId, null)} />
					</FormField>			
					
					{familyRecords.map(record => (
						<li key={record.id}>
							<TextButton
								variant="dark"
								size="xlarge"
								onClick={() => {
									setFamilyRecId(record.id);
								}}
								
							>
							{record.getCellValue(surnameField)} ,
							</TextButton> 
							{record.getCellValue(addressField)} , {record.getCellValue(postcodeField)} 
							
						</li>
					))}
					
				</div>		
			);
		}
	}
}

function setIds(setter1, value1, setter2, value2){
	setter1(value1);
	setter2(value2);
}

async function addNeedRecord(tNeed, linkField, nameField, name, typeField, type, familyRecordId){
	
	if (tNeed.hasPermissionToCreateRecord()) {
		
			const newRecordId = await tNeed.createRecordAsync({
							[linkField]: [{id: familyRecordId}],
							[nameField]: name,
							[typeField]: type,
								});
	}
}

function SettingsMenu(props) {


    const resetNeedTableRelatedKeys = () => {
		props.globalConfig.setAsync(GlobalConfigKeys.TEMPLATE_TABLE_ID, '');
		props.globalConfig.setAsync(GlobalConfigKeys.TEMPLATE_NAME_FIELD_ID, '' );
		props.globalConfig.setAsync(GlobalConfigKeys.TEMPLATE_TYPE_FIELD_ID, '' );		
		props.globalConfig.setAsync(GlobalConfigKeys.FAMILY_TABLE_ID, '');
		props.globalConfig.setAsync(GlobalConfigKeys.FAMILY_ID_FIELD_ID, '');
		props.globalConfig.setAsync(GlobalConfigKeys.FAMILY_SURNAME_FIELD_ID, '');
		props.globalConfig.setAsync(GlobalConfigKeys.FAMILY_ADDRESS_FIELD_ID, '');
		props.globalConfig.setAsync(GlobalConfigKeys.FAMILY_POSTCODE_FIELD_ID, '');
		props.globalConfig.setAsync(GlobalConfigKeys.NEED_NAME_FIELD_ID, '');
		props.globalConfig.setAsync(GlobalConfigKeys.NEED_TYPE_FIELD_ID, '');
		props.globalConfig.setAsync(GlobalConfigKeys.NEED_FAMILY_LINK_FIELD_ID, '');
		
    };

    const getLinkedFamilyTable = () => {
        const linkFieldId = props.globalConfig.get(GlobalConfigKeys.NEED_FAMILY_LINK_FIELD_ID);
        const needTableId = props.globalConfig.get(GlobalConfigKeys.NEED_TABLE_ID);
        const needTable   = props.base.getTableByIdIfExists(needTableId);

        const linkField = needTable.getFieldByIdIfExists(linkFieldId);
        const familyTableId = linkField.options.linkedTableId;

        props.globalConfig.setAsync(GlobalConfigKeys.FAMILY_TABLE_ID, familyTableId);
   };

    return(
        <div>
            <Heading margin={2}>
                Request Settings
            </Heading>
            <Box marginX={2}>
                <FormField label="Which table holds the requests?">
                    <TablePickerSynced
                        globalConfigKey={GlobalConfigKeys.NEED_TABLE_ID}
                        onChange={() => resetNeedTableRelatedKeys()}
                        size="large"
                        maxWidth="350px"
                    />
                </FormField>
                {props.needTable &&
                    <div>
                        <Heading size="xsmall" variant="caps">{props.needTable.name} Fields:</Heading>
                        <Box display="flex" flexDirection="row">
                            <FormField label="Family link:" marginRight={1}>
                                <FieldPickerSynced
                                    size="small"
                                    table={props.needTable}
                                    globalConfigKey={GlobalConfigKeys.NEED_FAMILY_LINK_FIELD_ID}
                                    allowedTypes={[
                                        FieldType.MULTIPLE_RECORD_LINKS
                                    ]}
									onChange={() => getLinkedFamilyTable()}
                                />
                            </FormField>
							
                            <FormField label="Name:" marginRight={1}>
                                <FieldPickerSynced
                                    size="small"
                                    table={props.needTable}
                                    globalConfigKey={GlobalConfigKeys.NEED_NAME_FIELD_ID}
                                    allowedTypes={[
                                        FieldType.SINGLE_LINE_TEXT
                                    ]}
                                />
                            </FormField>
							
                            <FormField label="Type:" marginRight={1}>
                                <FieldPickerSynced
                                    size="small"
                                    table={props.needTable}
                                    globalConfigKey={GlobalConfigKeys.NEED_TYPE_FIELD_ID}
                                    allowedTypes={[
                                        FieldType.SINGLE_LINE_TEXT
										
                                    ]}
                                />
                            </FormField>
							
						</Box>
                    </div>
                }

				{props.familyTable &&
                    <div>
                        <Heading size="xsmall" variant="caps">{props.familyTable.name} Fields:</Heading>
                        <Box display="flex" flexDirection="row">
                            <FormField label="Id field:" marginRight={1}>
                                <FieldPickerSynced
                                    size="small"
                                    table={props.familyTable}
                                    globalConfigKey={GlobalConfigKeys.FAMILY_ID_FIELD_ID}
                                    allowedTypes={[
                                        FieldType.NUMBER,
										FieldType.AUTO_NUMBER
                                    ]}
                                />
                            </FormField>
                            <FormField label="Full name:" marginRight={1}>
                                <FieldPickerSynced
                                    size="small"
                                    table={props.familyTable}
                                    globalConfigKey={GlobalConfigKeys.FAMILY_SURNAME_FIELD_ID}
                                    allowedTypes={[
                                        FieldType.SINGLE_LINE_TEXT,
										FieldType.FORMULA
                                    ]}
                                />
                            </FormField>

							<FormField label="Address:" marginRight={1}>
                                <FieldPickerSynced
                                    size="small"
                                    table={props.familyTable}
                                    globalConfigKey={GlobalConfigKeys.FAMILY_ADDRESS_FIELD_ID}
                                    allowedTypes={[
                                        FieldType.MULTILINE_TEXT,
										FieldType.SINGLE_LINE_TEXT
                                    ]}
                                />
                            </FormField>
                            <FormField label="Postcode:" marginRight={1}>
                                <FieldPickerSynced
                                    size="small"
                                    table={props.familyTable}
                                    globalConfigKey={GlobalConfigKeys.FAMILY_POSTCODE_FIELD_ID}
                                    allowedTypes={[
                                        FieldType.SINGLE_LINE_TEXT
                                    ]}
                                />
                            </FormField>

                        </Box>
 
                    </div>
                }

                <FormField label="Which table holds the template?">
                    <TablePickerSynced
                        globalConfigKey={GlobalConfigKeys.TEMPLATE_TABLE_ID}
                        size="large"
                        maxWidth="350px"
                    />
                </FormField>
                {props.templateTable &&
                    <div>
                        <Heading size="xsmall" variant="caps">{props.templateTable.name} Fields:</Heading>
                        <Box display="flex" flexDirection="row">
                            <FormField label="Name:" marginRight={1}>
                                <FieldPickerSynced
                                    size="small"
                                    table={props.templateTable}
                                    globalConfigKey={GlobalConfigKeys.TEMPLATE_NAME_FIELD_ID}
                                    allowedTypes={[
                                        FieldType.SINGLE_LINE_TEXT
                                    ]}
                                />
                            </FormField>
                            <FormField label="Type:" marginRight={1}>
                                <FieldPickerSynced
                                    size="small"
                                    table={props.templateTable}
                                    globalConfigKey={GlobalConfigKeys.TEMPLATE_TYPE_FIELD_ID}
                                    allowedTypes={[
                                        FieldType.SINGLE_LINE_TEXT
                                    ]}
                                />
                            </FormField>							
						</Box>
                    </div>
                }

                <Box display="flex" marginBottom={2}>
					<Button
						variant="primary"
						icon="check"
						marginLeft={2}
						disabled={!props.initialSetupDone}
						onClick={props.onDoneClick}
						alignSelf="right"
					>
						Done
					</Button>
				</Box>
			</Box>
		</div>
    );
}

initializeBlock(() => <Needs />);
