import { selectTheme } from './actions';
import * as fontManager from './fontmanager';
import ThemeEditor from './ThemeEditor';
import { themeDir } from './util';

import * as Promise from 'bluebird';
import { remote } from 'electron';
import * as fs from 'fs-extra-promise';
import { actions, ComponentEx, log, types } from 'nmm-api';
import * as path from 'path';
import * as React from 'react';
import { Button, ControlLabel, FormControl, FormGroup } from 'react-bootstrap';
import { translate } from 'react-i18next';
import { connect } from 'react-redux';
import * as Redux from 'redux';

interface IConnectedProps {
  currentTheme: string;
}

interface IActionProps {
  onSelectTheme: (theme: string) => void;
  onShowDialog: (
    type: types.DialogType,
    title: string,
    content: types.IDialogContent,
    actions: types.IDialogActions,
  ) => Promise<types.IDialogResult>;
}

type IProps = IConnectedProps & IActionProps;

interface IComponentState {
  themes: string[];
  availableFonts: string[];
  variables: { [key: string]: string };
  editable: boolean;
}

class SettingsTheme extends ComponentEx<IProps, IComponentState> {
  constructor(props: IProps) {
    super(props);

    this.initState({
      themes: [],
      availableFonts: [],
      variables: {},
      editable: props.currentTheme !== 'default',
    });
  }

  public componentWillMount() {
    const baseDir = themeDir();
    // consider all directories in the theme directory as themes
    fs.readdirAsync(baseDir)
      .filter<string>(fileName =>
        fs.statAsync(path.join(baseDir, fileName))
          .then(stat => stat.isDirectory()))
      .then(directories => {
        this.nextState.themes = directories
          .map(name => path.basename(name));
        this.updateVariables(this.props.currentTheme);

        return new Promise<string[]>((resolve, reject) => {
          fontManager.getAvailableFonts((fonts) => {
            resolve(Array.from(new Set<string>(fonts.map(font => font.family))).sort());
          });
        });
      })
      .then(fonts => {
        this.nextState.availableFonts = fonts;
      });
  }

  public componentWillReceiveProps(newProps: IProps) {
    if (this.props.currentTheme !== newProps.currentTheme) {
      this.updateVariables(newProps.currentTheme);
      this.nextState.editable = newProps.currentTheme !== 'default';
    }
  }

  public render(): JSX.Element {
    const { t, currentTheme } = this.props;
    const { availableFonts, editable, variables } = this.state;
    return (
      <div>
      <form>
        <FormGroup controlId='themeSelect'>
          <ControlLabel>{t('Theme')}</ControlLabel>
          <FormControl
            componentClass='select'
            onChange={this.selectTheme}
            value={currentTheme}
          >
            { this.renderTheme(null, t('default')) }
            { this.state.themes.map(theme => this.renderTheme(theme, theme)) }
          </FormControl>
          <Button onClick={this.clone} >{ t('Clone') }</Button>
        </FormGroup>
      </form>
      { editable
          ? (
            <ThemeEditor
              t={t}
              theme={variables}
              onApply={this.saveTheme}
              availableFonts={availableFonts}
            />
          ) : null }
      </div>
    );
  }

  public renderTheme(key: string, name: string) {
    return <option key={key} value={key}>{name}</option>;
  }

  private saveTheme = (variables: { [name: string]: string }) => {
    this.saveThemeInternal(this.props.currentTheme, variables)
    .then(() => {
      this.context.api.events.emit('select-theme', this.props.currentTheme);
    });
  }

  private saveThemeInternal(themeName: string, variables: { [name: string]: string }) {
    const baseDir = themeDir();
    const theme = Object.keys(variables)
      .map(name => `\$${name}: ${variables[name]};`);
    return fs.writeFileAsync(path.join(baseDir, themeName, 'variables.scss'), theme.join('\r\n'));
  }

  private updateVariables(currentTheme: string) {
    const baseDir = themeDir();
    fs.readFileAsync(path.join(baseDir, currentTheme, 'variables.scss'))
    .then(data => {
      const variables = {};
      data.toString('utf-8').split('\r\n').forEach(line => {
        const [key, value] = line.split(':');
        if (value !== undefined) {
          variables[key.substr(1)] = value.trim().replace(/;*$/, '');
        }
      });
      this.nextState.variables = variables;
    })
    .catch(err => {
      log('warn', 'failed to read variables', err);
    });
  }

  private clone = () => {
    const { currentTheme, onShowDialog } = this.props;
    const { themes } = this.state;
    onShowDialog('question', 'Enter a name', {
      input: [ {
          id: 'name',
          placeholder: 'Theme Name',
          value: currentTheme,
        } ],
    }, {
      Cancel: null,
      Clone: null,
    }).then(res => {
      if (res.action === 'Clone') {
        if (res.input.name && (themes.indexOf(res.input.name) === -1)) {
          const targetDir = path.join(themeDir(), res.input.name);
          fs.ensureDirAsync(targetDir)
          .then(() => this.saveThemeInternal(res.input.name, this.state.variables))
          .then(() => {
            this.nextState.themes.push(res.input.name);
            this.context.api.events.emit('select-theme', res.input.name);
          });
        }
      }
    });
  }

  private selectTheme = (evt) => {
    const theme = evt.currentTarget.value;
    this.props.onSelectTheme(theme);
    this.context.api.events.emit('select-theme', theme);
  }
}

function mapStateToProps(state: any): IConnectedProps {
  return {
    currentTheme: state.settings.interface.currentTheme,
  };
}

function mapDispatchToProps(dispatch: Redux.Dispatch<any>): IActionProps {
  return {
    onSelectTheme: (theme: string) => dispatch(selectTheme(theme)),
    onShowDialog: (type, title, content, dialogActions) =>
      dispatch(actions.showDialog(type, title, content, dialogActions)),
  };
}

export default
  translate(['common'], { wait: false })(
    connect(mapStateToProps, mapDispatchToProps)(
      SettingsTheme)) as React.ComponentClass<{}>;
