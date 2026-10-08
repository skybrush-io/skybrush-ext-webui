import type { RegistryWidgetsType, TemplatesType } from '@rjsf/utils'

import {
  AddButton,
  ArrayFieldItemButtonsTemplate,
  ArrayFieldItemTemplate,
  ArrayFieldTemplate,
  BaseInputTemplate,
  ClearButton,
  CopyItemButton,
  DescriptionFieldTemplate,
  ErrorListTemplate,
  FieldErrorTemplate,
  FieldHelpTemplate,
  FieldTemplate,
  MoveDownButton,
  MoveUpButton,
  ObjectFieldTemplate,
  RemoveButton,
  SubmitButton,
  TitleFieldTemplate,
  WrapIfAdditionalTemplate,
} from './templates'
import {
  CheckboxesWidget,
  CheckboxWidget,
  SelectWidget,
  TextareaWidget,
} from './widgets'

export const templates: Partial<TemplatesType> = {
  ArrayFieldItemButtonsTemplate,
  ArrayFieldItemTemplate,
  ArrayFieldTemplate,
  BaseInputTemplate,
  DescriptionFieldTemplate,
  ErrorListTemplate,
  FieldErrorTemplate,
  FieldHelpTemplate,
  FieldTemplate,
  ObjectFieldTemplate,
  TitleFieldTemplate,
  WrapIfAdditionalTemplate,
  ButtonTemplates: {
    AddButton,
    ClearButton,
    CopyButton: CopyItemButton,
    MoveDownButton,
    MoveUpButton,
    RemoveButton,
    SubmitButton,
  },
}

export const widgets: RegistryWidgetsType = {
  CheckboxWidget,
  CheckboxesWidget,
  SelectWidget,
  TextareaWidget,
}
