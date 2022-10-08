---
layout: post
title:  "Vagrant, NFS et Catalina"
date:   2019-10-14
tags:
- vagrant
- macos
description: >
  Quickfix pour un problème de NFS avec Vagrant et macOS Catalina
---

## Catalina et son nouveau système de volumes

Avec sa version 10.15 Catalina, macOS introduit un nouveau système de volumes en lecture seule. Concrètement, cela se traduit surtout pour vous le fait que votre dossier personnel `/Users/bobby` n'est plus modifiable, il faudra se rediriger vers `/System/Volumes/Data/Users/bobby`.

Au quotidien cela ne posera pas de problème, mais Vagrant n'apprécie pas trop si vous essayez de créer des dossiers partagés sur `/Users/bobby` comme ceci :

```ruby
config.vm.synced_folder '/Users/bobby/shared-folder', '/shared-folder', type: 'nfs'
```

Si vous êtes un utilisateur de [Trellis](https://roots.io/trellis/) et que vous placez vos projets dans un dossier personnel, vous aurez constaté que vos Vagrant ne fonctionnent plus. En cause, le `Vagrantfile` qui vient définir une variable `ANSIBLE_PATH` sur `__dir__` :
```ruby
ANSIBLE_PATH = __dir__
…
Vagrant.configure('2') do |config|
  …
  if vagrant_mount_type != 'nfs' || Vagrant::Util::Platform.wsl? || (Vagrant::Util::Platform.windows? && !Vagrant.has_plugin?('vagrant-winnfsd'))
    vagrant_mount_type = nil if vagrant_mount_type == 'nfs'
    trellis_config.wordpress_sites.each_pair do |name, site|
      config.vm.synced_folder local_site_path(site), remote_site_path(name, site), owner: 'vagrant', group: 'www-data', mount_options: mount_options(vagrant_mount_type, dmode: 776, fmode: 775), type: vagrant_mount_type, **extra_options
    end

    config.vm.synced_folder ANSIBLE_PATH, ANSIBLE_PATH_ON_VM, mount_options: mount_options(vagrant_mount_type, dmode: 755, fmode: 644), type: vagrant_mount_type, **extra_options
    config.vm.synced_folder File.join(ANSIBLE_PATH, 'bin'), bin_path, mount_options: mount_options(vagrant_mount_type, dmode: 755, fmode: 755), type: vagrant_mount_type, **extra_options
  elsif !Vagrant.has_plugin?('vagrant-bindfs')
    fail_with_message "vagrant-bindfs missing, please install the plugin with this command:\nvagrant plugin install vagrant-bindfs"
  else
    trellis_config.wordpress_sites.each_pair do |name, site|
      config.vm.synced_folder local_site_path(site), nfs_path(name), type: 'nfs'
      config.bindfs.bind_folder nfs_path(name), remote_site_path(name, site), u: 'vagrant', g: 'www-data', o: 'nonempty'
    end

    config.vm.synced_folder ANSIBLE_PATH, '/ansible-nfs', type: 'nfs'
    config.bindfs.bind_folder '/ansible-nfs', ANSIBLE_PATH_ON_VM, o: 'nonempty', p: '0644,a+D'
    config.bindfs.bind_folder bin_path, bin_path, perms: '0755'
  end
  …
end
```

Dans ces deux cas vous ferez face à une erreur de ce type :

```sh
NFS is reporting that your exports file is invalid. Vagrant does
this check before making any changes to the file. Please correct
the issues below and execute "vagrant reload":

exports:2: exported dir/fs mismatch: /Users/bobby/shared-folder /System/Volumes/Data
```

## Utiliser l'absolute path du volume

La solution est simple, il suffit d'utiliser le path `/System/Volumes/Data/Users/bobby` plutôt que `/Users/bobby` :

```ruby
config.vm.synced_folder '/System/Volumes/Data/Users/bobby/shared-folder', '/shared-folder', type: 'nfs'
```

Pour Trellis, afin de permettre aux développeurs sur macOS Mojave (ou précédent) de continuer à utiliser leurs Vagrant, vous pouvez vérifier l'existance sur dossier `/System/Volume/Data`, et agir en conséquence sur la variable `ANSIBLE_PATH`. Remplacez la première ligne de votre Vagrantfile par les suivantes (merci à @mmoollllee pour le bout de code) :

```ruby
if Dir.exist?('/System/Volumes/Data')
  ANSIBLE_PATH = '/System/Volumes/Data' + __dir__ # absolute path to Ansible directory on host machine for macos Catalina
else
  ANSIBLE_PATH = __dir__ # absolute path to Ansible directory on host machine
end
```

## Liens

[The new read-only system volume in macOS Catalina](https://support.apple.com/en-in/HT210650)
[@mmoollllee solutions on Vagrants's GitHub](https://github.com/hashicorp/vagrant/issues/10961#issuecomment-540594254)