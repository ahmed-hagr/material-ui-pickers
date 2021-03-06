import * as React from 'react';
import { RangeInput, DateRange } from './RangeTypes';
import { useUtils } from '../_shared/hooks/useUtils';
import { makeStyles } from '@material-ui/core/styles';
import { MaterialUiPickersDate } from '../typings/date';
import { CurrentlySelectingRangeEndProps } from './RangeTypes';
import { useMaskedInput } from '../_shared/hooks/useMaskedInput';
import { WrapperVariantContext } from '../wrappers/WrapperVariantContext';
import { DateInputProps, MuiTextFieldProps } from '../_shared/PureDateInput';
import { mergeRefs, executeInTheNextEventLoopTick } from '../_helpers/utils';

export const useStyles = makeStyles(
  theme => ({
    rangeInputsContainer: {
      display: 'flex',
      alignItems: 'baseline',
      [theme.breakpoints.down('xs')]: {
        flexDirection: 'column',
        alignItems: 'center',
      },
    },
    toLabelDelimiter: {
      margin: '8px 0',
      [theme.breakpoints.up('sm')]: {
        margin: '0 16px',
      },
    },
  }),
  { name: 'MuiPickersDateRangePickerInput' }
);

export interface ExportedDateRangePickerInputProps {
  /**
   * Render input component for date range. Where `props` – [TextField](https://material-ui.com/api/text-field/#textfield-api) component props
   * @example ```jsx
   * <DateRangePicker
   * renderInput={(startProps, endProps) => (
       <>
         <TextField {...startProps} />
         <Typography> to <Typography>
         <TextField {...endProps} />
       </>;
     )}
     />
   * ````
   */
  renderInput: (startProps: MuiTextFieldProps, endProps: MuiTextFieldProps) => React.ReactElement;
}

export interface DateRangeInputProps
  extends ExportedDateRangePickerInputProps,
    CurrentlySelectingRangeEndProps,
    Omit<DateInputProps<RangeInput, DateRange>, 'renderInput' | 'forwardedRef'> {
  startText: React.ReactNode;
  endText: React.ReactNode;
  forwardedRef?: React.Ref<HTMLDivElement>;
  containerRef?: React.Ref<HTMLDivElement>;
}

export const DateRangePickerInput: React.FC<DateRangeInputProps> = ({
  rawValue,
  onChange,
  parsedDateValue: [start, end],
  open,
  containerRef,
  forwardedRef,
  currentlySelectingRangeEnd,
  setCurrentlySelectingRangeEnd,
  openPicker,
  disableOpenPicker,
  startText,
  endText,
  readOnly,
  renderInput,
  TextFieldProps,
  onBlur,
  ...other
}) => {
  const utils = useUtils();
  const classes = useStyles();
  const startRef = React.useRef<HTMLInputElement>(null);
  const endRef = React.useRef<HTMLInputElement>(null);
  const wrapperVariant = React.useContext(WrapperVariantContext);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    if (currentlySelectingRangeEnd === 'start') {
      startRef.current?.focus();
    } else if (currentlySelectingRangeEnd === 'end') {
      endRef.current?.focus();
    }
  }, [currentlySelectingRangeEnd, open]);

  // TODO: rethink this approach. We do not need to wait for calendar to be updated to rerender input (looks like freezing)
  // TODO: so simply break 1 react's commit phase in 2 (first for input and second for calendars) by executing onChange in the next tick
  const lazyHandleChangeCallback = React.useCallback(
    (...args: Parameters<typeof onChange>) =>
      executeInTheNextEventLoopTick(() => onChange(...args)),
    [onChange]
  );

  const handleStartChange = (date: MaterialUiPickersDate, inputString?: string) => {
    if (date === null || utils.isValid(date)) {
      lazyHandleChangeCallback([date, end], inputString);
    }
  };

  const handleEndChange = (date: MaterialUiPickersDate, inputString?: string) => {
    if (date === null || utils.isValid(date)) {
      lazyHandleChangeCallback([start, date], inputString);
    }
  };

  const openRangeStartSelection = () => {
    if (setCurrentlySelectingRangeEnd) {
      setCurrentlySelectingRangeEnd('start');
    }
    if (!disableOpenPicker) {
      openPicker();
    }
  };

  const openRangeEndSelection = () => {
    if (setCurrentlySelectingRangeEnd) {
      setCurrentlySelectingRangeEnd('end');
    }
    if (!disableOpenPicker) {
      openPicker();
    }
  };

  const openOnFocus = wrapperVariant === 'desktop';
  const startInputProps = useMaskedInput({
    ...other,
    readOnly,
    rawValue: start,
    parsedDateValue: start,
    onChange: handleStartChange,
    label: startText,
    TextFieldProps: {
      ...TextFieldProps,
      ref: startRef,
      variant: 'outlined',
      focused: open && currentlySelectingRangeEnd === 'start',
      onClick: !openOnFocus ? openRangeStartSelection : undefined,
      onFocus: openOnFocus ? openRangeStartSelection : undefined,
    },
  });

  const endInputProps = useMaskedInput({
    ...other,
    readOnly,
    label: endText,
    rawValue: end,
    parsedDateValue: end,
    onChange: handleEndChange,
    TextFieldProps: {
      ...TextFieldProps,
      ref: endRef,
      variant: 'outlined',
      focused: open && currentlySelectingRangeEnd === 'end',
      onClick: !openOnFocus ? openRangeEndSelection : undefined,
      onFocus: openOnFocus ? openRangeEndSelection : undefined,
    },
  });

  return (
    <div
      onBlur={onBlur}
      className={classes.rangeInputsContainer}
      ref={mergeRefs([containerRef, forwardedRef])}
    >
      {renderInput(startInputProps, endInputProps)}
    </div>
  );
};
