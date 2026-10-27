import { Fragment } from 'react';
import { commandsIn, formatValue, keyChords, menuPath, type Setting, settingsOn } from '@/lib/docs-export';
import { docsExport, docsSource } from '@/lib/docs-export-data';

function Keys({ keys }: { keys: string }) {
  // Chords and the keys in a chord are distinct, so they key themselves.
  return keyChords(keys).map((chord, i) => (
    <Fragment key={chord.join('+')}>
      {i > 0 && ', '}
      {chord.map((key, j) => (
        <Fragment key={key}>
          {j > 0 && '+'}
          <kbd>{key}</kbd>
        </Fragment>
      ))}
    </Fragment>
  ));
}

/** Where the lists come from: the release, or the development build until a release has them. */
export function ExportSource() {
  const { version, commit } = docsExport.meta;
  if (docsSource.kind === 'release') {
    return (
      <p>
        Generated from HikariSub {version} (<a href={docsSource.url}>{docsSource.url.split('/').pop()}</a>).
      </p>
    );
  }
  return (
    <p>
      Generated from a development build of HikariSub ({version}, commit <code>{commit.slice(0, 9)}</code>).
      From 0.1.0-beta.1 on, these lists follow each release.
    </p>
  );
}

/** The commands of one window, with their default keys and where the menus have them. */
export function HotkeyTable({ context }: { context: string }) {
  const commands = commandsIn(docsExport.commands.commands, context);
  return (
    <table data-testid={`hotkeys-${context}`} className="table-fixed">
      <colgroup>
        <col className="w-[38%]" />
        <col className="w-[22%]" />
        <col />
      </colgroup>
      <thead>
        <tr>
          <th>Command</th>
          <th>Keys</th>
          <th>In the menus</th>
        </tr>
      </thead>
      <tbody>
        {commands.map((command) => (
          <tr key={command.id}>
            <td>{command.name}</td>
            <td className="whitespace-nowrap">
              {command.defaultKeys
                .filter((k) => k.context === context)
                .map((k, i) => (
                  <Fragment key={k.keys}>
                    {i > 0 && <br />}
                    <Keys keys={k.keys} />
                  </Fragment>
                ))}
            </td>
            <td>
              {command.menus.map((place, i) => (
                <Fragment key={place}>
                  {i > 0 && <br />}
                  {menuPath(place)}
                </Fragment>
              ))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Allowed({ setting }: { setting: Setting }) {
  if (setting.control === 'number' && setting.min !== undefined && setting.max !== undefined) {
    return (
      <>
        {setting.min} to {setting.max}
        {setting.unit && ` ${setting.unit}`}
      </>
    );
  }
  if (setting.values && setting.values.length > 0 && setting.values.length <= 12) {
    return setting.values.map((v, i) => (
      <Fragment key={String(v.value)}>
        {i > 0 && ', '}
        {v.label}
      </Fragment>
    ));
  }
  if (setting.values && setting.values.length > 12) return <>{setting.values.length} choices</>;
  if (setting.control === 'choice') return <>What this computer has</>;
  if (setting.control === 'colour') return <>Any color</>;
  return null;
}

function Default({ setting }: { setting: Setting }) {
  if (setting.control === 'colour' && typeof setting.default === 'string') {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
        <span
          aria-hidden
          className="inline-block size-3.5 rounded-sm border"
          style={{ background: setting.default }}
        />
        <code>{setting.default}</code>
      </span>
    );
  }
  return <>{formatValue(setting)}</>;
}

/** One Settings page: each section's settings, with the value a new profile has. */
export function SettingsTable({ page }: { page: string }) {
  return settingsOn(docsExport.settings.settings, page).map((section) => (
    <Fragment key={section.title}>
      <h3>{section.title}</h3>
      <table data-testid={`settings-${page}`} className="table-fixed">
        <colgroup>
          <col className="w-[50%]" />
          <col className="w-[20%]" />
          <col />
        </colgroup>
        <thead>
          <tr>
            <th>Setting</th>
            <th>Default</th>
            <th>Can be</th>
          </tr>
        </thead>
        <tbody>
          {section.settings.map((setting) => (
            <tr key={setting.key}>
              <td>
                {setting.label}
                {setting.platform === 'windows' && ' (Windows)'}
                {setting.hint && (
                  <>
                    <br />
                    <small className="text-fd-muted-foreground">{setting.hint}</small>
                  </>
                )}
              </td>
              <td>
                <Default setting={setting} />
              </td>
              <td>
                <Allowed setting={setting} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Fragment>
  ));
}
