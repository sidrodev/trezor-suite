import { FONT_FAMILY, FONT_SIZE, FONT_WEIGHT, LINE_HEIGHT, TRANSITION } from 'config/variables';
import React from 'react';
import styled, { css } from 'styled-components';
import { getStateIcon } from 'utils/icons';
import { getPrimaryColor } from 'utils/colors';

import Icon from 'components/Icon';
import PropTypes from 'prop-types';
import colors from 'config/colors';

const Wrapper = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
`;

const InputWrapper = styled.div`
    display: flex;
`;

const InputIconWrapper = styled.div`
    flex: 1;
    position: relative;
    display: inline-block;
    background: white;
`;

const TopLabel = styled.span`
    padding-bottom: 10px;
    color: ${colors.TEXT_SECONDARY};
`;

const StyledInput = styled.input`
    width: 100%;
    height: ${props => (props.height ? `${props.height}px` : '40px')};
    padding: 5px ${props => (props.hasIcon ? '40px' : '12px')} 6px 12px;

    font-family: ${FONT_FAMILY.MONOSPACE};
    line-height: ${LINE_HEIGHT.SMALL};
    font-size: ${props => (props.isSmallText ? `${FONT_SIZE.SMALL}` : `${FONT_SIZE.BASE}`)};
    font-weight: ${FONT_WEIGHT.MEDIUM};
    color: ${props => (props.color ? props.color : colors.TEXT)};
    box-sizing: border-box;

    border-radius: 2px;
    
    ${props =>
        props.hasAddon &&
        css`
            border-top-right-radius: 0;
            border-bottom-right-radius: 0;
        `}

    border: 1px solid ${props => props.border || colors.INPUT_BORDER};

    background-color: ${colors.WHITE};
    transition: ${TRANSITION.HOVER};

    &:disabled {
        pointer-events: none;
        background: ${colors.GRAY_LIGHT};
        color: ${colors.TEXT_SECONDARY};
    }

    &:read-only  {
        background: ${colors.GRAY_LIGHT};
        color: ${colors.TEXT_SECONDARY};
    }

    &:focus {
        box-shadow: ${colors.INPUT_FOCUS_SHADOW} 0px 0px 6px 0px;
        border-color: ${props => props.border || colors.INPUT_FOCUS_BORDER};
        outline: none;
    }

    ${props =>
        props.tooltipAction &&
        css`
            z-index: 10001; /* bigger than modal container */
            position: relative;
        `};
`;

const StyledIcon = styled(Icon)`
    position: absolute;
    left: auto;
    top: 12px;
    right: 15px;
`;

const BottomText = styled.span`
    margin-top: 10px;
    font-size: ${FONT_SIZE.SMALL};
    color: ${props => (props.color ? props.color : colors.TEXT_SECONDARY)};
`;

const Overlay = styled.div`
    ${props =>
        props.isPartiallyHidden &&
        css`
            bottom: 0;
            border: 1px solid ${colors.DIVIDER};
            border-radius: 2px;
            position: absolute;
            width: 100%;
            height: 100%;
            background-image: linear-gradient(
                to right,
                rgba(0, 0, 0, 0) 0%,
                rgba(249, 249, 249, 1) 220px
            );
        `}
`;

const TooltipAction = styled.div`
    display: ${props => (props.action ? 'flex' : 'none')};
    align-items: center;
    height: 37px;
    margin: 0px 10px;
    padding: 0 14px;
    position: absolute;
    top: 45px;
    background: black;
    color: ${colors.WHITE};
    border-radius: 5px;
    line-height: ${LINE_HEIGHT.TREZOR_ACTION};
    z-index: 10002;
    transform: translate(-1px, -1px);
`;

const ArrowUp = styled.div`
    position: absolute;
    top: -9px;
    left: 12px;
    width: 0;
    height: 0;
    border-left: 9px solid transparent;
    border-right: 9px solid transparent;
    border-bottom: 9px solid black;
    z-index: 10001;
`;

const Input = ({
    className,
    innerRef,
    placeholder,
    type,
    height,
    autocorrect,
    autocapitalize,
    icon,
    spellCheck,
    value,
    readOnly,
    autoSelect,
    onChange,
    state,
    bottomText,
    topLabel,
    tooltipAction,
    sideAddons,
    isDisabled,
    name,
    isSmallText,
    isPartiallyHidden,
    ...rest
}) => {
    return (
        <Wrapper className={className} {...rest}>
            {topLabel && <TopLabel>{topLabel}</TopLabel>}
            <InputWrapper>
                <InputIconWrapper>
                    {state && (
                        <StyledIcon
                            icon={getStateIcon(state)}
                            color={getPrimaryColor(state)}
                            size={16}
                        />
                    )}
                    <Overlay isPartiallyHidden={isPartiallyHidden} />
                    {icon}
                    <StyledInput
                        autoComplete="off"
                        height={height}
                        tooltipAction={tooltipAction}
                        hasIcon={icon || getStateIcon(state)}
                        ref={innerRef}
                        hasAddon={!!sideAddons}
                        type={type}
                        color={getPrimaryColor(state)}
                        placeholder={placeholder}
                        autoCorrect={autocorrect}
                        autoCapitalize={autocapitalize}
                        spellCheck={spellCheck}
                        isSmallText={isSmallText}
                        value={value}
                        readOnly={readOnly}
                        onChange={onChange}
                        onClick={autoSelect ? event => event.target.select() : null}
                        border={getPrimaryColor(state)}
                        disabled={isDisabled}
                        name={name}
                        data-lpignore="true"
                    />
                    <TooltipAction action={tooltipAction}>
                        <ArrowUp />
                        {tooltipAction}
                    </TooltipAction>
                </InputIconWrapper>
                {sideAddons && sideAddons.map(sideAddon => sideAddon)}
            </InputWrapper>
            {bottomText && <BottomText color={getPrimaryColor(state)}>{bottomText}</BottomText>}
        </Wrapper>
    );
};

Input.propTypes = {
    className: PropTypes.string,
    innerRef: PropTypes.func,
    placeholder: PropTypes.string,
    type: PropTypes.string,
    height: PropTypes.number,
    autocorrect: PropTypes.string,
    autocapitalize: PropTypes.string,
    icon: PropTypes.node,
    spellCheck: PropTypes.string,
    value: PropTypes.string,
    readOnly: PropTypes.bool,
    autoSelect: PropTypes.bool,
    onChange: PropTypes.func,
    state: PropTypes.oneOf(['success', 'warning', 'error']),
    bottomText: PropTypes.node,
    topLabel: PropTypes.node,
    tooltipAction: PropTypes.node,
    sideAddons: PropTypes.arrayOf(PropTypes.node),
    isDisabled: PropTypes.bool,
    name: PropTypes.string,
    isSmallText: PropTypes.bool,
    isPartiallyHidden: PropTypes.bool,
};

Input.defaultProps = {
    type: 'text',
    autoSelect: false,
    height: 40,
};

export default Input;
