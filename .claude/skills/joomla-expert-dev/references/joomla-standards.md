# Joomla Development Standards Reference

## Version Compatibility Matrix

| Feature | J3 (Legacy) | J4 | J5 | J6 |
|---------|------------|-----|-----|-----|
| PHP Min | 5.6 | 7.2.5 | 8.1 | 8.2 |
| Namespace | Non | Oui (PSR-4) | Oui | Oui |
| WebAssetManager | Non | Oui | Oui | Oui |
| DI Container | Non | Oui | Oui | Oui |
| MVC Refactored | Legacy MVC | MVCFactory | MVCFactory | MVCFactory |
| Bootstrap | 2.3 | 5.x | 5.x | 5.x |
| jQuery | Inclus | Optionnel | Optionnel | Optionnel |

## Class Migration Guide (J3 -> J4+)

```
JFactory                    -> Joomla\CMS\Factory
JFactory::getDbo()          -> Factory::getContainer()->get('DatabaseDriver')
JFactory::getApplication()  -> Factory::getApplication()
JFactory::getUser()         -> Factory::getApplication()->getIdentity()
JFactory::getDocument()     -> Factory::getApplication()->getDocument()
JFactory::getLanguage()     -> Factory::getApplication()->getLanguage()
JFactory::getSession()      -> Factory::getApplication()->getSession()
JText::_()                  -> Joomla\CMS\Language\Text::_()
JHtml::_()                  -> Joomla\CMS\HTML\HTMLHelper::_()
JInput                      -> Joomla\CMS\Input\Input
JUri                        -> Joomla\CMS\Uri\Uri
JRoute                      -> Joomla\CMS\Router\Route
JLog                        -> Joomla\CMS\Log\Log
JPlugin                     -> Joomla\CMS\Plugin\CMSPlugin
JModuleHelper               -> Joomla\CMS\Helper\ModuleHelper
JLayoutHelper               -> Joomla\CMS\Layout\LayoutHelper
JComponentHelper            -> Joomla\CMS\Component\ComponentHelper
JAccess                     -> Joomla\CMS\Access\Access
JTable                      -> Joomla\CMS\Table\Table
JForm                       -> Joomla\CMS\Form\Form
JMail                       -> Joomla\CMS\Mail\Mail
JFile                       -> Joomla\CMS\Filesystem\File
JFolder                     -> Joomla\CMS\Filesystem\Folder
JPath                       -> Joomla\CMS\Filesystem\Path
```

## Module Structure (J4/J5/J6)

```
mod_example/
├── mod_example.xml              # Manifest
├── services/
│   └── provider.php             # Service provider (DI)
├── src/
│   ├── Dispatcher/
│   │   └── Dispatcher.php       # Main dispatcher
│   └── Helper/
│       └── ExampleHelper.php    # Data helper
├── tmpl/
│   └── default.php              # Layout template
└── language/
    ├── en-GB/
    │   └── mod_example.ini
    └── fr-FR/
        └── mod_example.ini
```

## Plugin Structure (J4/J5/J6)

```
plg_system_example/
├── example.xml                  # Manifest
├── services/
│   └── provider.php             # Service provider
├── src/
│   └── Extension/
│       └── Example.php          # Plugin class
└── language/
    └── en-GB/
        ├── plg_system_example.ini
        └── plg_system_example.sys.ini
```

## Component Structure (J4/J5/J6)

```
com_example/
├── example.xml                  # Manifest
├── administrator/
│   ├── services/
│   │   └── provider.php
│   ├── src/
│   │   ├── Controller/
│   │   ├── Model/
│   │   ├── View/
│   │   ├── Table/
│   │   └── Extension/
│   ├── tmpl/
│   ├── forms/
│   ├── sql/
│   │   ├── install.mysql.sql
│   │   └── uninstall.mysql.sql
│   └── language/
└── site/
    ├── src/
    │   ├── Controller/
    │   ├── Model/
    │   ├── View/
    │   └── Service/
    ├── tmpl/
    └── language/
```

## Template Override System

### Override Locations
- Component: `templates/{template}/html/com_{component}/{view}/`
- Module: `templates/{template}/html/mod_{module}/`
- Layout: `templates/{template}/html/layouts/`
- Plugin: `templates/{template}/html/plg_{type}_{name}/`

### Override Priority
1. Template override (highest)
2. Layout override
3. Original file (lowest)

## Security Checklist

- [ ] `defined('_JEXEC') or die;` on every PHP file
- [ ] Use `$db->quoteName()` for column/table names
- [ ] Use prepared statements or `$db->quote()` for values
- [ ] Use `$input->get()` with type filtering (never `$_GET`/`$_POST`)
- [ ] Use `Text::_()` for all user-facing strings
- [ ] Use `htmlspecialchars()` for output escaping
- [ ] CSRF token check: `Session::checkToken()` on form submissions
- [ ] ACL checks: `$user->authorise('core.edit', 'com_example')`
- [ ] File upload validation: extension, MIME type, size
- [ ] No `eval()`, `exec()`, or dynamic includes from user input

## WebAssetManager Usage

```php
// In template index.php
$wa = $this->getWebAssetManager();

// Register and use
$wa->registerAndUseStyle('mytheme', 'templates/mytheme/css/styles.css');
$wa->registerAndUseScript('mytheme', 'templates/mytheme/js/app.js', [], ['defer' => true]);

// Inline styles/scripts
$wa->addInlineStyle('.my-class { color: red; }');
$wa->addInlineScript('console.log("loaded");');

// Dependencies
$wa->registerScript('mylib', 'templates/mytheme/js/lib.js');
$wa->registerAndUseScript('myapp', 'templates/mytheme/js/app.js', ['mylib']);

// Disable core assets
$wa->disableScript('bootstrap.collapse');
```

## HCM ACCOUNTING Template Specifics

### CSS Variables (template.css)
```css
:root {
    --bg-body: #f4f7f6;
    --text-main: #2c3e50;
    --text-muted: #7f8c8d;
    --primary: #0984e3;
    --header-height: 80px;
    --spacing-lg: 32px;
    --radius-sm: 6px;
    --glass-border: 1px solid rgba(0,0,0,0.05);
}

[data-theme="dark"] {
    --bg-body: #050a14;
    --text-main: #e0e0e0;
    --text-muted: #8899aa;
    --bg-card: rgba(255,255,255,0.03);
}
```

### Key CSS Selectors
- Header: `header` (position: fixed, z-index: 1000)
- Nav: `header nav`, `.header-nav-bar`
- Mobile toggle: `#mobile-menu-toggle`, `.mobile-menu-toggle`
- Mobile menu: `nav.mobile-active`
- Language switcher: `.mod-languages`, `.header-right-area`
- Hero: `.hero`, `.hero-content`
- Footer: `footer`, `.footer-grid`

### JavaScript Init Functions (main.js)
- `initMobileMenu()` - Hamburger toggle
- `initHeaderScroll()` - Header shrink on scroll
- `initRevealAnimations()` - Scroll reveal effects
- `initStatCounters()` - Number animation
- `initActiveNavLinks()` - Active menu highlighting
- `initSmoothScroll()` - Smooth anchor scrolling
- `initTheme()` - Dark/light mode
- `initLazyLoad()` - Image lazy loading
